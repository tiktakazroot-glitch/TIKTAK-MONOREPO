import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRoute } from "../Route.factory";

export const customRoutes: RoutesMap = {
    // ============================================
    // Favorites
    // ============================================
    "/api/favorites": createRoute({
        method: "GET",
        authRequired: false,
        type: "api",
    }),
    "/api/favorites/:cardId": createRoute({
        method: "POST",
        authRequired: true,
        type: "api",
    }),
    "/api/favorites/delete/:cardId": createRoute({
        method: "DELETE",
        authRequired: true,
        type: "api",
    }),

    // ============================================
    // Notifications (account-level, not workspace-scoped)
    // ============================================
    "/api/custom/notifications": createRoute({
        method: "GET",
        authRequired: true,
        type: "api",
    }),
};
