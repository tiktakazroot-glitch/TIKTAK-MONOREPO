import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRoute } from "../Route.factory";

export const publicRoutes: RoutesMap = {
  // ============================================
  // Public Pages
  // ============================================
  "/": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/deactivation": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/cards": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/cards/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/stores": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/stores/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/blogs": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/blogs/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),

  // Error & Utility Pages
  "/not-found": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/forbidden": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/unauthorized": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),

  // Auth Pages (Shared)
  "/auth/login": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/verify/email": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/auth/verify/phone": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),

  // ============================================
  // Public APIs
  // ============================================
  "/api/cards": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/cards/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/categories": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/cities": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/stores": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/blogs": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/accounts/check-username": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/category/filters": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/categories/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/categories/filters": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),

  "/api/deactivation": createRoute({
    method: "POST",
    authRequired: false,
    type: "api",
  }),

  // ============================================
  // Public Docs / Pages APIs
  // ============================================
  "/api/docs/rules": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/about": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/faq": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/privacy": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/terms": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/pricing": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),
  "/api/docs/refund": createRoute({
    method: "GET",
    authRequired: false,
    type: "api",
  }),

  // ============================================
  // Public Doc Pages
  // ============================================
  "/docs/about": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/faq": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/privacy": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/terms": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/rules": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/pricing": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/docs/refund": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),

  // ============================================
  // Category Pages
  // ============================================
  "/categories": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/categories/:id": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
  "/categories/:id/catalogue": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),

  // ============================================
  // Map Page
  // ============================================
  "/map": createRoute({
    method: "GET",
    authRequired: false,
    type: "page",
  }),
};

/**
 * Helper to build public URLs from patterns
 */
export const buildPublicUrl = (pattern: string, params: Record<string, string | number>) => {
  let url = pattern;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, value.toString());
  }
  return url;
};
