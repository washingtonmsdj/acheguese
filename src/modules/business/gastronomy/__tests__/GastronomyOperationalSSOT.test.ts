import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy operational SSOT flow", () => {
  it("keeps customer order details reachable outside merchant Central", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");
    const notificationSource = readProjectFile(
      "src/modules/mobility/delivery/services/OrderDeliveryNotificationService.ts",
    );

    expect(routesSource).toContain('path="/gastronomia/pedidos/:orderId"');
    expect(routesSource).toContain("<P.OrderDetailsPage />");
    expect(notificationSource).toContain("customerOrderUrl");
    expect(notificationSource).toContain("`/gastronomia/pedidos/${order.id}`");
    expect(notificationSource).toContain('actionLabel: customerActionUrl ? "Abrir pedido" : null');
  });

  it("uses the canonical review service and private trust SSOT after delivery", () => {
    const panelSource = readProjectFile(
      "src/modules/business/gastronomy/components/orders/OrderPublicReviewPanel.tsx",
    );

    expect(panelSource).toContain("ReviewQueryService.createReview");
    expect(panelSource).toContain("ReviewQueryService.canUserReviewBusiness");
    expect(panelSource).toContain("TrustEventService.upsertOperationalFeedback");
    expect(panelSource).toContain("TRUST_CONTEXT_TYPES.ORDER");
    expect(panelSource).toContain("TRUST_ACTOR_ROLES.MERCHANT");
    expect(panelSource).not.toContain(".from('reviews')");
    expect(panelSource).not.toContain('.from("reviews")');
    expect(panelSource).not.toContain(".from('trust_events')");
    expect(panelSource).not.toContain('.from("trust_events")');
  });

  it("keeps merchant-only order operations out of the public customer order route", () => {
    const pageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/OrderDetailsPage.tsx",
    );

    expect(pageSource).toContain("const isBusinessRoute = Boolean(businessId)");
    expect(pageSource).toContain("{isBusinessRoute &&");
    expect(pageSource).toContain("<OrderOperationsPanel");
    expect(pageSource).toContain("<OrderTrustFeedbackPanel");
    expect(pageSource).toContain("<OrderPublicReviewPanel order={order} />");
  });

  it("keeps operational config aligned with useOperationConfig canonical contract", () => {
    const formSource = readProjectFile(
      "src/modules/business/gastronomy/components/hours/OperationConfigForm.tsx",
    );
    const hookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useOperationConfig.ts",
    );

    expect(hookSource).toContain("updateConfig: updateMutation.mutate");
    expect(hookSource).toContain("isUpdating: updateMutation.isPending");
    expect(formSource).toContain("updateConfig({");
    expect(formSource).toContain("disabled={isUpdating}");
    expect(formSource).not.toContain("setConfig");
    expect(formSource).not.toContain("isSettingConfig");
  });

  it("does not show fake operational counters in the merchant dashboard", () => {
    const dashboardSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyDashboardPage.tsx",
    );

    expect(dashboardSource).toContain("<OperationalStatusCard");
    expect(dashboardSource).toContain("<TodayOrdersCard");
    expect(dashboardSource).toContain("<MenuSummaryCard");
    expect(dashboardSource).toContain("<DeliverySummaryCard");
    expect(dashboardSource).toContain("usageStats?.currentMenuItems");
    expect(dashboardSource).toContain("usageStats?.currentPromotions");
    expect(dashboardSource).not.toContain('<span className="font-medium">0</span>');
    expect(dashboardSource).not.toContain('<span className="font-medium text-green-600">Aberto</span>');
  });

  it("exposes item availability and stock operations through the menu SSOT", () => {
    const formSource = readProjectFile(
      "src/modules/business/gastronomy/components/menu/ItemForm.tsx",
    );
    const cardSource = readProjectFile(
      "src/modules/business/gastronomy/components/menu/ItemCard.tsx",
    );
    const pageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/MenuManagementPage.tsx",
    );
    const hookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useMenuItems.ts",
    );
    const serviceSource = readProjectFile(
      "src/modules/business/gastronomy/services/MenuService.ts",
    );

    expect(formSource).toContain('name="is_available"');
    expect(formSource).toContain('name="stock_quantity"');
    expect(formSource).toContain('name="stock_alert_threshold"');
    expect(formSource).toContain("stock_quantity: item?.stock_quantity ?? undefined");
    expect(formSource).toContain("stock_alert_threshold: item?.stock_alert_threshold ?? undefined");
    expect(cardSource).toContain("const isSoldOut = item.stock_quantity === 0");
    expect(cardSource).toContain("Marcar esgotado");
    expect(cardSource).toContain("onMarkSoldOut");
    expect(pageSource).toContain("handleMarkItemSoldOut");
    expect(pageSource).toContain("updateItem({ itemId, stock_quantity: 0, is_available: false })");
    expect(hookSource).toContain("stock_quantity?: number");
    expect(hookSource).toContain("stock_alert_threshold?: number");
    expect(hookSource).toContain("is_available?: boolean");
    expect(serviceSource).toContain("stock_quantity: input.stock_quantity ?? null");
    expect(serviceSource).toContain("stock_alert_threshold: input.stock_alert_threshold ?? null");
    expect(serviceSource).toContain("is_available: input.is_available ?? true");
    expect(serviceSource).not.toContain("preparation_time_min: input.preparation_time_min || null");
  });
});
