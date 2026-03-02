import type { RoutesMap } from "@/lib/routes/Route.types";
import { createRouteFactory } from "../Route.factory";

// Create root-specific route factory for workspace management
const createRoute = createRouteFactory({
  workspace: 'root',
  needEmailVerification: true,
  needPhoneVerification: true
});

export const workspacesRootRoutes: RoutesMap = {
  // ============================================
  // Workspace Management APIs
  // ============================================

  "/api/workspaces/list": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),

  "/api/workspaces/create": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  "/api/workspaces/onboarding": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Billing & Subscriptions API
  // ============================================
  "/api/workspaces/billing/subscriptions": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/transactions": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/tiers": createRoute({
    method: "GET",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/coupon": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/pay": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),
  "/api/workspaces/billing/initiate": createRoute({
    method: "POST",
    authRequired: true,
    type: "api",
  }),

  // ============================================
  // Workspace Root Pages
  // ============================================
  "/workspaces": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/onboarding/welcome": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/provider": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
  "/workspaces/onboarding/advertiser": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/enroll/:providerId": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/profile": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/billing": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),

  "/workspaces/billing/checkout": createRoute({
    method: "GET",
    authRequired: true,
    type: "page",
  }),
};
