import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business extension identity boundary (G6)", () => {
  it("keeps route/profile identity separate from business_data extension identity", () => {
    const mapper = read("src/core/business/services/business.mappers.ts");
    const dashboard = read(
      "src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx",
    );
    const dashboardContext = read(
      "src/modules/business/dashboard/businessDashboardContext.ts",
    );

    expect(mapper).toContain("id: data.profile_id || data.id");
    expect(mapper).toContain("business_data_id: data.id");
    expect(dashboardContext).toContain("businessId: string");
    expect(dashboardContext).toContain("businessDataId: string");
    expect(dashboard).toContain(
      "const businessDataId = business?.business_data_id",
    );
    expect(dashboard).toContain("useBusinessSubscription(businessDataId)");
    expect(dashboard).toContain(
      'useGastronomyStatus(businessDataId || "", isGastronomyEligible)',
    );
    expect(dashboard).toContain("businessDataId,");
  });

  it("preserves both identities in the private profile workspace", () => {
    const rowType = read(
      "src/core/profiles/services/profile.service.types.ts",
    );
    const externalQueries = read(
      "src/core/profiles/services/profile.external-data.queries.ts",
    );
    const mapper = read(
      "src/core/profiles/services/profile.service.rules.ts",
    );
    const aggregate = read(
      "src/core/profiles/services/profile.workspace.aggregate.ts",
    );
    const snapshotBuilder = read(
      "src/core/profiles/services/profile.workspace.business-modules.ts",
    );
    const delivery = read("src/modules/profile/sections/DeliverySection.tsx");

    expect(rowType).toContain("id: string");
    expect(rowType).toContain("profile_id: string");
    expect(externalQueries).toMatch(/\nid,\s*\n\s*profile_id,/);
    expect(mapper).toContain("id: business.profile_id");
    expect(mapper).toContain("business_data_id: business.id");
    expect(aggregate).toContain(
      "EntitlementResolver.resolve({",
    );
    expect(aggregate).toContain(
      "business_id: business.business_data_id",
    );
    expect(aggregate).toContain(
      'subscription_scope: "business"',
    );
    expect(aggregate).toContain(
      "current_period_end: resolvedEntitlements.currentPeriodEnd",
    );
    expect(aggregate).toContain(
      "getGastronomyProfileByBusinessId(business.business_data_id)",
    );
    expect(snapshotBuilder).toContain(
      "businessDataId: business.business_data_id",
    );
    expect(delivery).toContain("business_id: item.businessDataId");
    expect(delivery).not.toContain("business_id: item.businessId");
  });

  it("uses business_data.id for Gastronomy persistence while retaining profile id for routes", () => {
    const gastronomyDashboard = read(
      "src/modules/business/gastronomy/pages/GastronomyDashboardPage.tsx",
    );
    const menu = read(
      "src/modules/business/gastronomy/pages/MenuManagementPage.tsx",
    );
    const hours = read(
      "src/modules/business/gastronomy/pages/BusinessHoursPage.tsx",
    );
    const deliveryArea = read(
      "src/modules/business/gastronomy/pages/DeliveryAreaPage.tsx",
    );
    const orders = read(
      "src/modules/business/gastronomy/pages/OrdersPage.tsx",
    );
    const orderDetails = read(
      "src/modules/business/gastronomy/pages/OrderDetailsPage.tsx",
    );

    expect(gastronomyDashboard).toContain(
      "const { businessId, businessDataId } = useBusinessDashboardContext()",
    );
    expect(gastronomyDashboard).toContain("business_id: businessDataId");
    expect(gastronomyDashboard).toContain("getMenuUsageStats(businessDataId)");
    expect(menu).toContain("useBusinessSubscription(businessDataId)");
    expect(menu).toContain("useGastronomyMenuId(businessDataId)");
    expect(menu).toContain("useGastronomyProfile(businessDataId)");
    expect(hours).toContain(
      "const { businessDataId } = useBusinessDashboardContext()",
    );
    expect(deliveryArea).toContain("useDeliveryAreas(businessDataId)");
    expect(orders).toContain(
      "const { businessId, businessDataId } = useBusinessDashboardContext()",
    );
    expect(orders).toContain("useOrders(\n    businessDataId,");
    expect(orderDetails).toContain(
      "const routeBusinessId = dashboardContext?.businessId ?? businessId",
    );
    expect(orderDetails).toContain(
      "const businessDataId = dashboardContext?.businessDataId ?? order.business_id",
    );
  });

  it("brokers operational Business entitlements for owner or delegated manager", () => {
    const billingHook = read(
      "src/core/billing/hooks/useBusinessSubscription.ts",
    );
    const resolver = read(
      "src/core/billing/services/EntitlementResolver.ts",
    );
    const brokerClient = read(
      "src/core/billing/services/BillingEntitlementsRpcService.ts",
    );
    const brokerEdge = read(
      "supabase/functions/billing-entitlements-rpc/index.ts",
    );

    expect(billingHook).toContain(
      "export function useBusinessSubscription(\n  businessDataId: string | undefined",
    );
    expect(billingHook).toContain("EntitlementResolver.resolve({");
    expect(billingHook).toContain("business_id: businessDataId");
    expect(billingHook).toContain("subscription_scope: 'business'");

    expect(resolver).toContain(
      "BillingEntitlementsRpcService.getBusinessSubscriptionSnapshot",
    );
    expect(resolver).toContain(
      "context.subscription_scope === 'business'",
    );
    expect(resolver).toContain(
      ".eq('subscription_scope', 'user')",
    );

    expect(brokerClient).toContain(
      '"getBusinessSubscriptionSnapshot"',
    );
    expect(brokerClient).toContain(
      "getBusinessSubscriptionSnapshot(\n    businessDataId: string",
    );
    expect(brokerClient).toContain(
      "current_period_end: string | null",
    );

    expect(brokerEdge).toContain(
      "getBusinessSubscriptionSnapshot: true",
    );
    expect(brokerEdge).toContain(
      '"broker_user_can_manage_profile"',
    );
    expect(brokerEdge).toContain(
      "requireOperationalAccount(",
    );
    expect(brokerEdge).toContain(
      "throw new RequestAuthorizationError",
    );
    expect(brokerEdge).toContain(
      "current_period_end: subscription.current_period_end ?? null",
    );
  });

  it("distinguishes structural owner from delegated manager in dashboard authority", () => {
    const ownership = read(
      "src/core/business/services/BusinessOwnershipService.ts",
    );
    const dashboardAccess = read(
      "src/core/business/hooks/useDashboardAccess.ts",
    );

    expect(ownership).toContain(
      "export type BusinessManagementRole = 'owner' | 'admin'",
    );
    expect(ownership).toContain(
      "static async resolveManagementRole",
    );
    expect(ownership).toContain("return 'owner'");
    expect(ownership).toContain("activeRole === 'admin' ? 'admin' : null");
    expect(ownership).toContain("static async isDirectOwner");

    expect(dashboardAccess).toContain(
      "BusinessOwnershipService.resolveManagementRole",
    );
    expect(dashboardAccess).toContain(
      'let role: "owner" | "admin" | null = null',
    );
    expect(dashboardAccess).toContain("role: role ?? undefined");
  });

  it("keeps company billing mutations owner-only and out of user pricing scope", () => {
    const businessPlans = read(
      "src/modules/business/dashboard/pages/BusinessPlansPage.tsx",
    );
    const educationPlans = read(
      "src/modules/business/education/pages/EducationPlansPage.tsx",
    );
    const billingService = read(
      "src/core/billing/BusinessSubscriptionService.ts",
    );

    expect(businessPlans).toContain(
      'const canManageBilling = permissions.role === "owner"',
    );
    expect(businessPlans).toContain(
      "BusinessSubscriptionService.updatePlan(\n        businessDataId",
    );
    expect(businessPlans).toContain(
      "Somente o Proprietario pode alterar a assinatura",
    );
    expect(businessPlans).not.toContain('<Link to="/planos">');

    expect(educationPlans).toContain(
      "const canManageBilling = permissions.role === 'owner'",
    );
    expect(educationPlans).toContain("businessId: businessDataId");
    expect(educationPlans).toContain("subscriptionScope: 'business'");
    expect(educationPlans).toContain("entityFamily: 'company'");
    expect(educationPlans).toContain(
      "Gestores podem acompanhar os recursos do plano",
    );

    expect(billingService).toContain("fetchCanonicalByBusinessDataId");
    expect(billingService).toContain("businessId: businessDataId");
  });

  it("adapts Education profile identity before crossing into Business Billing", () => {
    const educationSubscription = read(
      "src/modules/business/education/services/education-subscription.service.ts",
    );

    expect(educationSubscription).toContain(
      "BusinessService.getBusinessDataIdByProfileId(businessProfileId)",
    );
    expect(educationSubscription).toContain(
      "SubscriptionService.getByBusinessId(businessDataId)",
    );
    expect(educationSubscription).not.toContain(
      "SubscriptionService.getByBusinessId(businessProfileId)",
    );
  });

  it("names QR entitlement identity explicitly", () => {
    const qrWidget = read("src/core/qr/components/QrCodeWidget.tsx");

    expect(qrWidget).toContain("businessDataId?: string");
    expect(qrWidget).toContain(
      "useBusinessSubscription(businessDataId || '')",
    );
  });
});
