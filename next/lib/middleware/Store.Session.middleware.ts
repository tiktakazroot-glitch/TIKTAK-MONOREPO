/**
 * SessionStore — 3-Layer Redis Cache for Authentication
 *
 * Layer 1: sess:{sessionId}           → Session + User Identity     (TTL: 14 days)
 * Layer 2: ws:{accountId}:{wsId}      → Workspace Access + Role     (TTL: 10 min)
 * Layer 3: role:{roleName}            → Shared Permission Defs      (TTL: 1 hour)
 * Reverse: acct_sess:{accountId}      → SET of sessionIds           (TTL: 14 days)
 */

import redis from "@/lib/integrations/Redis.UpstashSession.client";
import { db } from "@/lib/database";
import { workspaceAccesses, workspaceRoles } from "@/lib/database/schema";
import { eq, and } from "drizzle-orm";
import { ConsoleLogger } from "@/lib/logging/Console.logger";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Session metadata (device/network info) */
export interface SessionMeta {
    ip: string;
    userAgent: string;
    os?: string;
    browser?: string;
    device?: string;
    createdAt: number;
}

/** L1: Session + User Identity */
export interface SessionPayload {
    accountId: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    meta: SessionMeta;
}

/** L2: Workspace Access (per account+workspace pair) */
export interface WorkspaceAccessPayload {
    workspaceId: string;
    workspaceType: string;
    roleName: string;
    subscriptionTier: string | null;
    subscribedUntil: number | null;
}

/** L3: Role Definition (shared across users) */
export interface RoleDefinitionPayload {
    name: string;
    permissions: string[];
    forWorkspaceType: string;
}

/** Combined result from resolve() */
export interface ResolvedSession {
    // From L1
    accountId: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    // From L2
    workspaceId: string;
    workspaceType: string;
    roleName: string;
    subscriptionTier: string | null;
    subscribedUntil: number | null;
    // From L3
    permissions: string[];
    // Session metadata
    sessionId: string;
}

/** Params for creating a new session */
export interface CreateSessionParams {
    accountId: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    meta?: Partial<SessionMeta>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PREFIX = {
    SESSION: "sess:",
    WORKSPACE: "ws:",
    ROLE: "role:",
    ACCOUNT_SESSIONS: "acct_sess:",
    TWO_FACTOR: "2fa:",
} as const;

const TTL = {
    SESSION: 14 * 24 * 60 * 60,      // 14 days in seconds
    WORKSPACE: 10 * 60,               // 10 minutes
    ROLE: 60 * 60,                     // 1 hour
    TWO_FACTOR: 10 * 60,              // 10 minutes — 2FA verification window
} as const;

// ═══════════════════════════════════════════════════════════════
// SESSION STORE
// ═══════════════════════════════════════════════════════════════

export class SessionStore {
    // ─────────────────────────────────────────────────────────────
    // CREATE — On login/register
    // ─────────────────────────────────────────────────────────────

    static async create(params: CreateSessionParams): Promise<{ sessionId: string } | null> {
        try {
            const sessionId = uuidv4();
            const sessionKey = PREFIX.SESSION + sessionId;
            const reverseKey = PREFIX.ACCOUNT_SESSIONS + params.accountId;

            const payload: SessionPayload = {
                accountId: params.accountId,
                userId: params.userId,
                email: params.email,
                firstName: params.firstName,
                lastName: params.lastName,
                emailVerified: params.emailVerified,
                phoneVerified: params.phoneVerified,
                meta: {
                    ip: params.meta?.ip || "0.0.0.0",
                    userAgent: params.meta?.userAgent || "unknown",
                    os: params.meta?.os,
                    browser: params.meta?.browser,
                    device: params.meta?.device,
                    createdAt: Date.now(),
                },
            };

            // Pipeline: SET session + SADD to reverse index
            const pipeline = redis.pipeline();
            pipeline.set(sessionKey, JSON.stringify(payload), "EX", TTL.SESSION);
            pipeline.sadd(reverseKey, sessionId);
            pipeline.expire(reverseKey, TTL.SESSION);
            await pipeline.exec();

            ConsoleLogger.info("SessionStore.create", { sessionId, accountId: params.accountId });

            return { sessionId };
        } catch (error) {
            ConsoleLogger.error("SessionStore.create error:", error);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // RESOLVE — The hot path (2 Redis calls on cache hit)
    // ─────────────────────────────────────────────────────────────

    static async resolve(sessionId: string, workspaceId?: string, workspaceType?: string): Promise<ResolvedSession | null> {
        try {
            // Step 1: Get session (L1)
            const sessionKey = PREFIX.SESSION + sessionId;
            const sessionJson = await redis.get(sessionKey);

            if (!sessionJson) {
                ConsoleLogger.debug("SessionStore.resolve: session not found", { sessionId });
                return null;
            }

            const session: SessionPayload = JSON.parse(sessionJson);

            // If no workspace requested, return session-only data
            if (!workspaceId) {
                return {
                    ...session,
                    workspaceId: "",
                    workspaceType: "",
                    roleName: "",
                    subscriptionTier: null,
                    subscribedUntil: null,
                    permissions: [],
                    sessionId,
                };
            }

            // Step 2: Get workspace access (L2) + try to get role (L3)
            // Include workspaceType in cache key so provider vs student access are cached separately
            const wsKeySuffix = workspaceType ? `:${workspaceType}` : "";
            const wsKey = PREFIX.WORKSPACE + session.accountId + ":" + workspaceId + wsKeySuffix;
            const wsJson = await redis.get(wsKey);

            let wsAccess: WorkspaceAccessPayload;
            let roleDefinition: RoleDefinitionPayload;

            if (wsJson) {
                // L2 cache hit
                wsAccess = JSON.parse(wsJson);

                // Try L3
                const roleKey = PREFIX.ROLE + wsAccess.roleName;
                const roleJson = await redis.get(roleKey);

                if (roleJson) {
                    // L3 cache hit — fully resolved from cache
                    roleDefinition = JSON.parse(roleJson);
                    ConsoleLogger.debug("SessionStore.resolve: full cache hit (0 DB queries)");
                } else {
                    // L3 miss — fetch role from DB
                    roleDefinition = await this.fetchAndCacheRole(wsAccess.roleName);
                }
            } else {
                // L2 miss — fetch workspace access + role from DB
                const dbResult = await this.fetchAndCacheWorkspaceAccess(session.accountId, workspaceId, workspaceType);
                if (!dbResult) {
                    ConsoleLogger.warn("SessionStore.resolve: no workspace access found", {
                        accountId: session.accountId,
                        workspaceId,
                    });
                    return null;
                }
                wsAccess = dbResult.access;
                roleDefinition = dbResult.role;
            }

            return {
                accountId: session.accountId,
                userId: session.userId,
                email: session.email,
                firstName: session.firstName,
                lastName: session.lastName,
                emailVerified: session.emailVerified,
                phoneVerified: session.phoneVerified,
                workspaceId: wsAccess.workspaceId,
                workspaceType: wsAccess.workspaceType,
                roleName: wsAccess.roleName,
                subscriptionTier: wsAccess.subscriptionTier,
                subscribedUntil: wsAccess.subscribedUntil,
                permissions: roleDefinition.permissions,
                sessionId,
            };
        } catch (error) {
            ConsoleLogger.error("SessionStore.resolve error:", error);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // REFRESH — TTL rollover (called from ApiInterceptor)
    // ─────────────────────────────────────────────────────────────

    static async refresh(sessionId: string): Promise<boolean> {
        try {
            const sessionKey = PREFIX.SESSION + sessionId;
            const result = await redis.expire(sessionKey, TTL.SESSION);
            return result === 1;
        } catch (error) {
            ConsoleLogger.error("SessionStore.refresh error:", error);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // DESTROY — Logout (single session)
    // ─────────────────────────────────────────────────────────────

    static async destroy(sessionId: string): Promise<boolean> {
        try {
            const sessionKey = PREFIX.SESSION + sessionId;

            // Get accountId to clean up reverse index
            const sessionJson = await redis.get(sessionKey);
            if (sessionJson) {
                const session: SessionPayload = JSON.parse(sessionJson);
                const reverseKey = PREFIX.ACCOUNT_SESSIONS + session.accountId;
                await redis.srem(reverseKey, sessionId);
            }

            await redis.del(sessionKey);
            ConsoleLogger.info("SessionStore.destroy", { sessionId });
            return true;
        } catch (error) {
            ConsoleLogger.error("SessionStore.destroy error:", error);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // DESTROY ALL — Suspension / password change
    // ─────────────────────────────────────────────────────────────

    static async destroyAllForAccount(accountId: string): Promise<boolean> {
        try {
            const reverseKey = PREFIX.ACCOUNT_SESSIONS + accountId;
            const sessionIds = await redis.smembers(reverseKey);

            if (sessionIds.length > 0) {
                const sessionKeys = sessionIds.map((id) => PREFIX.SESSION + id);
                const pipeline = redis.pipeline();
                sessionKeys.forEach((key) => pipeline.del(key));
                pipeline.del(reverseKey);
                await pipeline.exec();
            }

            ConsoleLogger.info("SessionStore.destroyAllForAccount", {
                accountId,
                count: sessionIds.length,
            });
            return true;
        } catch (error) {
            ConsoleLogger.error("SessionStore.destroyAllForAccount error:", error);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // INVALIDATION — Surgical cache clearing
    // ─────────────────────────────────────────────────────────────

    /** Invalidate L2 workspace cache for an account+workspace */
    static async invalidateWorkspace(accountId: string, workspaceId: string): Promise<void> {
        try {
            const wsKey = PREFIX.WORKSPACE + accountId + ":" + workspaceId;
            await redis.del(wsKey);
            ConsoleLogger.debug("SessionStore.invalidateWorkspace", { accountId, workspaceId });
        } catch (error) {
            ConsoleLogger.error("SessionStore.invalidateWorkspace error:", error);
        }
    }

    /** Invalidate L3 role cache — affects ALL users with this role */
    static async invalidateRole(roleName: string): Promise<void> {
        try {
            const roleKey = PREFIX.ROLE + roleName;
            await redis.del(roleKey);
            ConsoleLogger.info("SessionStore.invalidateRole", { roleName });
        } catch (error) {
            ConsoleLogger.error("SessionStore.invalidateRole error:", error);
        }
    }

    /** Invalidate all L2 workspace caches for an account (role change, etc.) */
    static async invalidateAllWorkspacesForAccount(accountId: string): Promise<void> {
        try {
            // We need to scan for ws:{accountId}:* keys
            // Using SCAN with a pattern specific to this account
            const pattern = PREFIX.WORKSPACE + accountId + ":*";
            let cursor = "0";
            const keysToDelete: string[] = [];

            do {
                const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
                cursor = nextCursor;
                keysToDelete.push(...keys);
            } while (cursor !== "0");

            if (keysToDelete.length > 0) {
                await redis.del(...keysToDelete);
            }

            ConsoleLogger.debug("SessionStore.invalidateAllWorkspacesForAccount", {
                accountId,
                count: keysToDelete.length,
            });
        } catch (error) {
            ConsoleLogger.error("SessionStore.invalidateAllWorkspacesForAccount error:", error);
        }
    }

    /** Update email/phone verification status in ALL L1 sessions for an account */
    static async updateVerificationStatus(
        accountId: string,
        update: { emailVerified?: boolean; phoneVerified?: boolean }
    ): Promise<void> {
        try {
            const reverseKey = PREFIX.ACCOUNT_SESSIONS + accountId;
            const sessionIds = await redis.smembers(reverseKey);

            if (sessionIds.length === 0) {
                ConsoleLogger.warn("SessionStore.updateVerificationStatus: no sessions found", { accountId });
                return;
            }

            const pipeline = redis.pipeline();

            for (const sid of sessionIds) {
                const sessionKey = PREFIX.SESSION + sid;
                const sessionJson = await redis.get(sessionKey);
                if (!sessionJson) continue;

                const session: SessionPayload = JSON.parse(sessionJson);

                // Merge verification update
                if (update.emailVerified !== undefined) session.emailVerified = update.emailVerified;
                if (update.phoneVerified !== undefined) session.phoneVerified = update.phoneVerified;

                // Preserve existing TTL
                const ttl = await redis.ttl(sessionKey);
                const expiry = ttl > 0 ? ttl : TTL.SESSION;

                pipeline.set(sessionKey, JSON.stringify(session), "EX", expiry);
            }

            await pipeline.exec();

            ConsoleLogger.info("SessionStore.updateVerificationStatus", {
                accountId,
                sessions: sessionIds.length,
                ...update,
            });
        } catch (error) {
            ConsoleLogger.error("SessionStore.updateVerificationStatus error:", error);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 2FA — Two-Factor Authentication Session Management
    // ─────────────────────────────────────────────────────────────

    /** Mark a session as 2FA-verified (called after successful OTP validation) */
    static async set2FAVerified(sessionId: string): Promise<boolean> {
        try {
            const twoFAKey = PREFIX.TWO_FACTOR + sessionId;
            await redis.set(twoFAKey, "verified", "EX", TTL.TWO_FACTOR);
            ConsoleLogger.info("SessionStore.set2FAVerified", { sessionId });
            return true;
        } catch (error) {
            ConsoleLogger.error("SessionStore.set2FAVerified error:", error);
            return false;
        }
    }

    /** Check if a session has been 2FA-verified */
    static async check2FAVerified(sessionId: string): Promise<boolean> {
        try {
            const twoFAKey = PREFIX.TWO_FACTOR + sessionId;
            const result = await redis.get(twoFAKey);
            return result !== null;
        } catch (error) {
            ConsoleLogger.error("SessionStore.check2FAVerified error:", error);
            return false;
        }
    }

    /** Clear 2FA verification for a session */
    static async clear2FA(sessionId: string): Promise<void> {
        try {
            const twoFAKey = PREFIX.TWO_FACTOR + sessionId;
            await redis.del(twoFAKey);
            ConsoleLogger.debug("SessionStore.clear2FA", { sessionId });
        } catch (error) {
            ConsoleLogger.error("SessionStore.clear2FA error:", error);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // DB FALLBACK — Fetch and cache on miss
    // ─────────────────────────────────────────────────────────────

    /** Fetch workspace access + role from DB, cache in L2 + L3
     *  Filters by workspaceType (from URL path) to resolve the correct access record
     */
    private static async fetchAndCacheWorkspaceAccess(
        accountId: string,
        workspaceId: string,
        workspaceType?: string
    ): Promise<{ access: WorkspaceAccessPayload; role: RoleDefinitionPayload } | null> {
        // Build WHERE conditions — include workspace type filter when available
        const conditions = [
            eq(workspaceAccesses.actorAccountId, accountId),
            eq(workspaceAccesses.targetWorkspaceId, workspaceId),
        ];
        if (workspaceType) {
            conditions.push(eq(workspaceRoles.forWorkspaceType, workspaceType));
        }

        const result = await db
            .select({
                roleName: workspaceAccesses.accessRole,
                permissions: workspaceRoles.permissions,
                workspaceType: workspaceRoles.forWorkspaceType,
                subscriptionTier: workspaceAccesses.subscriptionTier,
                subscribedUntil: workspaceAccesses.subscribedUntil,
            })
            .from(workspaceAccesses)
            .leftJoin(workspaceRoles, eq(workspaceAccesses.accessRole, workspaceRoles.name))
            .where(and(...conditions))
            .limit(1);

        const row = result[0];
        if (!row || !row.roleName) return null;

        // Parse permissions from JSON (handles both array and object formats)
        const rawPerms = row.permissions;
        const permissions: string[] = Array.isArray(rawPerms)
            ? rawPerms
            : (typeof rawPerms === 'object' && rawPerms !== null)
                ? Object.keys(rawPerms as Record<string, boolean>).filter((k) => (rawPerms as Record<string, boolean>)[k])
                : [];

        const access: WorkspaceAccessPayload = {
            workspaceId,
            workspaceType: row.workspaceType || "",
            roleName: row.roleName,
            subscriptionTier: (row.subscriptionTier as string) || null,
            subscribedUntil: row.subscribedUntil ? new Date(row.subscribedUntil as unknown as string).getTime() : null,
        };

        const role: RoleDefinitionPayload = {
            name: row.roleName,
            permissions,
            forWorkspaceType: row.workspaceType || "",
        };

        // Cache both L2 + L3
        const pipeline = redis.pipeline();
        const wsKeySuffix = workspaceType ? `:${workspaceType}` : "";
        const wsKey = PREFIX.WORKSPACE + accountId + ":" + workspaceId + wsKeySuffix;
        const roleKey = PREFIX.ROLE + row.roleName;
        pipeline.set(wsKey, JSON.stringify(access), "EX", TTL.WORKSPACE);
        pipeline.set(roleKey, JSON.stringify(role), "EX", TTL.ROLE);
        await pipeline.exec();

        ConsoleLogger.debug("SessionStore.fetchAndCacheWorkspaceAccess: DB fallback", {
            accountId,
            workspaceId,
            roleName: row.roleName,
        });

        return { access, role };
    }

    /** Fetch role definition from DB, cache in L3 */
    private static async fetchAndCacheRole(roleName: string): Promise<RoleDefinitionPayload> {
        const result = await db
            .select({
                name: workspaceRoles.name,
                permissions: workspaceRoles.permissions,
                forWorkspaceType: workspaceRoles.forWorkspaceType,
            })
            .from(workspaceRoles)
            .where(eq(workspaceRoles.name, roleName))
            .limit(1);

        const row = result[0];
        if (!row) {
            ConsoleLogger.warn("SessionStore.fetchAndCacheRole: role not found", { roleName });
            return { name: roleName, permissions: [], forWorkspaceType: "" };
        }

        const rawPerms = row.permissions;
        const permissions: string[] = Array.isArray(rawPerms)
            ? rawPerms
            : (typeof rawPerms === 'object' && rawPerms !== null)
                ? Object.keys(rawPerms as Record<string, boolean>).filter((k) => (rawPerms as Record<string, boolean>)[k])
                : [];

        const role: RoleDefinitionPayload = {
            name: row.name,
            permissions,
            forWorkspaceType: row.forWorkspaceType || "",
        };

        const roleKey = PREFIX.ROLE + roleName;
        await redis.set(roleKey, JSON.stringify(role), "EX", TTL.ROLE);

        ConsoleLogger.debug("SessionStore.fetchAndCacheRole: DB fallback", { roleName });

        return role;
    }
}
