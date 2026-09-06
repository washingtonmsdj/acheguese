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
      "SubscriptionService.getByBusinessId(business.business_data_id)",
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
    expect(gastronomyDashboard).toContain(
      "getMenuUsageStats(businessDataId)",
    );
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

  it("names Billing and QR entitlement identity explicitly", () => {
    const billingHook = read(
      "src/core/billing/hooks/useBusinessSubscription.ts",
    );
    const billingService = read(
      "src/core/billing/BusinessSubscriptionService.ts",
    );
    const qrWidget = read("src/core/qr/components/QrCodeWidget.tsx");

    expect(billingHook).toContain(
      "useBusinessSubscription(businessDataId: string | undefined)",
    );
    expect(billingHook).toContain(
      "BusinessSubscriptionService.getByBusinessId(businessDataId)",
    );
    expect(billingService).toContain(
      "fetchCanonicalByBusinessDataId",
    );
    expect(billingService).not.toContain("businessId");
    expect(qrWidget).toContain("businessDataId?: string");
    expect(qrWidget).toContain(
      "useBusinessSubscription(businessDataId || '')",
    );
  });
});
