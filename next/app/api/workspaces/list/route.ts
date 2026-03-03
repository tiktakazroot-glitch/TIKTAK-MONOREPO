import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET /api/workspaces/list
 * Returns all workspaces accessible to the authenticated user.
 */
export const GET = unifiedApiHandler(async (request, { module, authData }) => {
    try {
        const accountId = authData?.account?.id;

        if (!accountId) {
            return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
        }

        const result = await module.workspace.listWorkspacesForAccount(accountId);

        if (!result.success) {
            return errorResponse(result.error || "Failed to list workspaces", 500);
        }

        const workspaces = result.data?.workspaces || [];

        return okResponse({
            success: true,
            data: workspaces.map((ws: any) => ({
                workspaceId: ws.id,
                workspaceType: ws.type,
                title: ws.title,
                isStore: ws.isStore,
                isActive: ws.isActive,
            }))
        });

    } catch (error) {
        console.error("[WorkspaceList] Error:", error);
        return serverErrorResponse("Failed to list workspaces");
    }
});
