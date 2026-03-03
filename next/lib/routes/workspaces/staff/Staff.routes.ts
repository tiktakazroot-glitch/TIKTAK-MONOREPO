import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../../Route.factory";

// Create staff-specific route factory
const createStaffRoute = createRouteFactory({
  workspace: 'staff',
  needEmailVerification: true,
  needPhoneVerification: true
});

export const PERMISSIONS = {
  STAFF_ACCESS: "Access staff dashboard",

  STAFF_USER_READ: "View users info",
  STAFF_USER_UPDATE: "Update user information",
  STAFF_USER_DELETE: "Delete users",

  STAFF_CATEGORY_READ: "View categories and filters",
  STAFF_CATEGORY_UPDATE: "Manage categories and filters",

  STAFF_STORE_READ: "View all stores",
  STAFF_STORE_UPDATE: "Update stores",
  STAFF_STORE_DELETE: "Delete stores",

  STAFF_MAIL_SEND: "Manage system emails",

  STAFF_JOBS_READ: "Monitor background jobs",
} as const;

export const staffRoutes: RoutesMap = {
  // ============================================
  // Staff Pages
  // ============================================
  "/workspaces/staff/:workspaceId": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),

  "/workspaces/staff/:workspaceId/users": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "page",
  }),

  "/workspaces/staff/:workspaceId/categories": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CATEGORY_READ",
    type: "page",
  }),

  "/workspaces/staff/:workspaceId/stores": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_STORE_READ",
    type: "page",
  }),

  // ============================================
  // Staff APIs
  // ============================================

  // Users Management
  "/api/workspaces/staff/:workspaceId/users": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/:id": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_USER_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/users/update/:id": createStaffRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_USER_UPDATE",
    type: "api",
  }),

  // Categories & Filters
  "/api/workspaces/staff/:workspaceId/categories": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CATEGORY_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/categories/update/:id": createStaffRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_CATEGORY_UPDATE",
    type: "api",
  }),

  // Stores Management (Global)
  "/api/workspaces/staff/:workspaceId/stores": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_STORE_READ",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/stores/delete/:id": createStaffRoute({
    method: "DELETE",
    authRequired: true,
    permission: "STAFF_STORE_DELETE",
    type: "api",
  }),

  // System Settings
  "/api/workspaces/staff/:workspaceId/mail/send": createStaffRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_MAIL_SEND",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/access-routes": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),

  // Lookup Data
  "/api/staff/types": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_CATEGORY_READ",
    type: "api",
  }),

  // ============================================
  // Content Management Pages
  // ============================================
  "/workspaces/staff/:workspaceId/blogs": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/about": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/privacy": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/terms": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/pricing": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/refund": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/faq": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),
  "/workspaces/staff/:workspaceId/docs/rules": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "page",
  }),

  // ============================================
  // Content Management APIs — Blogs
  // ============================================
  "/api/workspaces/staff/:workspaceId/blogs": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/create": createStaffRoute({
    method: "POST",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/:id": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/update/:id": createStaffRoute({
    method: "PATCH",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/:id/publish": createStaffRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/blogs/:id/home-page": createStaffRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),

  // ============================================
  // Content Management APIs — Docs
  // ============================================
  "/api/workspaces/staff/:workspaceId/docs": createStaffRoute({
    method: "GET",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
  "/api/workspaces/staff/:workspaceId/docs/update": createStaffRoute({
    method: "PUT",
    authRequired: true,
    permission: "STAFF_ACCESS",
    type: "api",
  }),
};
