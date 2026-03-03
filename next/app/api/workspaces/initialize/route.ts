import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { generateSlimId } from "@/lib/utils/Helper.SlimUlid.util";
import { workspaces, workspaceAccesses } from "@/lib/database/schema";

/**
 * POST /api/workspaces/initialize
 * Auto-creates a personal provider workspace for legacy users who have 0 workspaces.
 * Idempotent: if user already has workspaces, returns them without creating a new one.
 */
export const POST = unifiedApiHandler(async (request, { module, authData, db }) => {
    try {
        const accountId = authData?.account?.id;
        const userId = authData?.user?.id;

        if (!accountId || !userId) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        // Check if user already has workspaces
        const existing = await module.workspace.listWorkspacesForAccount(accountId);
        const allWorkspaces = existing?.data?.workspaces || [];

        if (allWorkspaces.length > 0) {
            // Already has workspaces — return them (idempotent)
            return okResponse({
                initialized: false,
                message: "User already has workspaces",
                workspaces: allWorkspaces.map((ws: any) => ({
                    workspaceId: ws.id,
                    workspaceType: ws.type,
                    title: ws.title,
                }))
            });
        }

        // Create personal provider workspace
        const workspaceId = generateSlimId();
        const firstName = authData?.user?.email?.split('@')[0] || 'User';

        await db.transaction(async (trx) => {
            // 1. Create workspace
            await trx.insert(workspaces).values({
                id: workspaceId,
                type: 'provider',
                title: `${firstName}'s Workspace`,
                isStore: false,
                isActive: true,
                isBlocked: false,
                profile: {},
            });

            // 2. Create workspace access (owner link)
            await trx.insert(workspaceAccesses).values({
                actorAccountId: accountId,
                targetWorkspaceId: workspaceId,
                viaWorkspaceId: workspaceId,
                accessRole: 'manager',
            });
        });

        return okResponse({
            initialized: true,
            message: "Personal workspace created successfully",
            workspaces: [{
                workspaceId,
                workspaceType: 'provider',
                title: `${firstName}'s Workspace`,
            }]
        });

    } catch (error) {
        console.error("[WorkspaceInitialize] Error:", error);
        return serverErrorResponse("Failed to initialize workspace");
    }
});
