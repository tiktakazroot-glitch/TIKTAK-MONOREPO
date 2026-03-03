
import React from "react";
import { redirect } from "next/navigation";
import { allRoutes } from "@/lib/routes/_Route.index";
import { RouteValidator } from "@/lib/middleware/Validator.Route.middleware";
import { CoreAuthorizer, type AuthData } from "@/lib/middleware/Authorizer.Core.middleware";
import { GlobalInlineForbiddenWidget } from "@/app/[locale]/(global)/(widgets)/GlobalInlineForbidden.widget";
import { ConsoleLogger } from "@/lib/logging/Console.logger";
import { ModuleFactory } from "@/lib/domain/Domain.factory";
import type { AuthContext, ClientAuthData } from "@tiktak/shared/types/auth/AuthData.types";
import type { RouteConfig } from "@/lib/routes/Route.types";
import type { NextRequest } from "next/server";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface UIConfigInfo {
    config: RouteConfig | undefined;
    normalizedPath: string;
}

export interface UIAuthOptions {
    path: string;
    requiredPermissions?: string[] | null;
    loginRedirect?: string;
    forbiddenRedirect?: string;
    inlineHandlers?: boolean;
    isPublic?: boolean;
}

export interface UIHandlerContext {
    authData: AuthData | null;
    clientAuth: ClientAuthData | null;
    module: ModuleFactory;
    auth: AuthContext;
    path: string;
}

interface ResolvedPageParams {
    locale?: string;
    workspaceId?: string;
    [key: string]: string | undefined;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG HELPERS
// ═══════════════════════════════════════════════════════════════

function getRouteConfig(pathname: string): UIConfigInfo {
    // RouteValidator expects NextRequest; we construct a minimal shape
    const fakeRequest = { nextUrl: { pathname } } as NextRequest;
    const validation = RouteValidator.validateRoute(fakeRequest, allRoutes);
    const normalizedPath = validation.normalizedPath || pathname;

    if (!validation.isValid || !validation.route) {
        return {
            config: undefined,
            normalizedPath
        };
    }

    return {
        config: validation.route,
        normalizedPath
    };
}

function createAuthContext(authData: AuthData | null): AuthContext {
    if (authData) {
        return {
            userId: authData.user.id,
            accountId: typeof authData.account.id === 'string' ? authData.account.id : String(authData.account.id),
            permissions: authData.account.permissions || [],
            activeWorkspaceId: authData.account.workspaceId
        };
    }
    return {
        userId: "guest",
        accountId: "0",
    };
}

/** Map full AuthData → client-safe subset */
function toClientAuth(authData: AuthData): ClientAuthData {
    return {
        user: {
            id: authData.user.id,
            email: authData.user.email,
            firstName: authData.user.firstName,
            lastName: authData.user.lastName,
        },
        account: {
            id: authData.account.id,
            workspaceType: authData.account.workspaceType,
            role: authData.account.role,
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED PAGE/LAYOUT WRAPPER
// ═══════════════════════════════════════════════════════════════

/**
 * Higher-order wrapper for protected Server Components (Pages and Layouts)
 */
export function withUiAuth<P extends object>(
    Component: (props: P & UIHandlerContext) => React.ReactElement | Promise<React.ReactElement>,
    options: UIAuthOptions
) {
    const {
        path: explicitPath,
        requiredPermissions = null,
        loginRedirect = "/auth/login",
        forbiddenRedirect = "/forbidden",
        inlineHandlers = false,
        isPublic = false,
    } = options;

    if (!explicitPath) {
        throw new Error("withUiAuth requires 'path' option for security.");
    }

    const WrappedComponent = async function ProtectedUIComponent(props: P) {
        // Extract locale from params (standard Next.js pattern)
        const resolvedParams = await (props as P & { params: Promise<ResolvedPageParams> }).params;
        const locale = resolvedParams?.locale || "az";

        // 1. Handle Public Access
        if (isPublic) {
            const authContext = createAuthContext(null);
            const services = new ModuleFactory(authContext);
            return <Component {...props} authData={null} clientAuth={null} module={services} auth={authContext} path={explicitPath} />;
        }

        // 2. Resolve Config
        const { config, normalizedPath } = getRouteConfig(explicitPath);
        ConsoleLogger.log(`🔐 UI access: ${normalizedPath} [${locale}]`);

        // 3. Determine required permissions
        const permissions = requiredPermissions || (config?.permission ? [config.permission] : []);
        const authRequired = config?.authRequired ?? true;

        if (!authRequired && permissions.length === 0) {
            const authContext = createAuthContext(null);
            const services = new ModuleFactory(authContext);
            return <Component {...props} authData={null} clientAuth={null} module={services} auth={authContext} path={normalizedPath} />;
        }

        // 4. Validate access
        const workspaceId = resolvedParams?.workspaceId;
        const authResult = await CoreAuthorizer.validateRouteRequest({
            routeConfig: config,
            requiredPermissions: permissions,
            workspaceId
        });

        const { isValid, code, authData, accountId } = authResult;

        // 6. Handle Failures
        if (!isValid) {
            ConsoleLogger.log(`⛔ UI Auth failed: ${code}`);

            switch (code) {
                case "UNAUTHORIZED":
                    redirect(`/${locale}${loginRedirect}?redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "ACCOUNT_SUSPENDED":
                    redirect(`/${locale}/auth/suspended`);
                    break;
                case "EMAIL_NOT_VERIFIED":
                case "VERIFY_EMAIL_REQUIRED":
                    // Prevent infinite redirect if already on verification page
                    if (normalizedPath.startsWith('/auth/verify')) {
                        break; // Proceed to render the page (it allows user to verify)
                    }
                    redirect(`/${locale}/auth/verify?type=email&redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "PHONE_NOT_VERIFIED":
                case "VERIFY_PHONE_REQUIRED":
                    // Prevent infinite redirect if already on verification page
                    if (normalizedPath.startsWith('/auth/verify')) {
                        break;
                    }
                    redirect(`/${locale}/auth/verify?type=phone&redirect=${encodeURIComponent(normalizedPath)}`);
                    break;
                case "PERMISSION_DENIED":
                case "WORKSPACE_MISMATCH":
                default:
                    if (inlineHandlers) return <GlobalInlineForbiddenWidget returnUrl={normalizedPath} />;
                    redirect(`/${locale}${forbiddenRedirect}`);
            }
        }

        // 7. Success - Create Service Context
        ConsoleLogger.log(`✓ UI access granted: ${normalizedPath} for account ${accountId}`);

        const validAuthData = authData!;
        const authContext = createAuthContext(validAuthData);
        const services = new ModuleFactory(authContext);

        return <Component
            {...props}
            authData={validAuthData}
            clientAuth={toClientAuth(validAuthData)}
            module={services}
            auth={authContext}
            path={normalizedPath}
        />;
    };

    return WrappedComponent;
}

// ═══════════════════════════════════════════════════════════════
// ALIASES
// ═══════════════════════════════════════════════════════════════

export const withPageAuth = withUiAuth;
export const withLayoutAuth = withUiAuth;
