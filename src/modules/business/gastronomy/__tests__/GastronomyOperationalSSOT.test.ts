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
    const routesSource = readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx");
    const notificationSource = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliveryNotificationService.ts",
    );

    expect(routesSource).toContain("gastronomyPublicRoutes.orderDetails(GASTRONOMY_PUBLIC_ROUTE_PARAMS.orderId)");
    expect(routesSource).toContain("<P.OrderDetailsPage />");
    expect(notificationSource).toContain("customerOrderUrl");
    expect(notificationSource).toContain("businessManagementRoutes.gastronomyPedidoPublico(order.id)");
    expect(notificationSource).toContain('actionLabel: customerActionUrl ? "Abrir pedido" : null');
    expect(notificationSource).toContain("actionUrl: mobilityRoutes.motoboy.entregas");
    expect(notificationSource).toContain("dedupeNotifications");
    expect(notificationSource).toContain("event_label");
  });

  it("keeps order screens subscribed to canonical order and timeline updates", () => {
    const ordersHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useOrders.ts",
    );
    const orderDetailsHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useOrderDetails.ts",
    );
    const realtimeServiceSource = readProjectFile(
      "src/modules/business/gastronomy/services/GastronomyOrderRealtimeService.ts",
    );

    expect(ordersHookSource).toContain("GastronomyOrderRealtimeService.subscribeBusinessOrders");
    expect(realtimeServiceSource).toContain("gastronomy-orders:${businessId}");
    expect(realtimeServiceSource).toContain('table: "orders"');
    expect(realtimeServiceSource).toContain("filter: `source_id=eq.${businessId}`");
    expect(realtimeServiceSource).toContain('table: "order_timeline_events"');
    expect(realtimeServiceSource).toContain('.eq("source_id", businessId)');
    expect(ordersHookSource).toContain("setTimeout(() => {");
    expect(ordersHookSource).toContain("verifiedBusinessOrderIdsRef");
    expect(orderDetailsHookSource).toContain("GastronomyOrderRealtimeService.subscribeOrderDetails");
    expect(realtimeServiceSource).toContain("gastronomy-order:${orderId}");
    expect(realtimeServiceSource).toContain("filter: `id=eq.${orderId}`");
    expect(realtimeServiceSource).toContain("filter: `order_id=eq.${orderId}`");
    expect(orderDetailsHookSource).toContain("setTimeout(() => {");
    expect(ordersHookSource).not.toContain("refetchInterval:");
    expect(orderDetailsHookSource).not.toContain("refetchInterval:");
  });

  it("keeps delivery tracking aligned with ride_requests realtime SSOT and fallback polling", () => {
    const trackingHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useOrderTracking.ts",
    );
    const realtimeServiceSource = readProjectFile(
      "src/modules/business/gastronomy/services/GastronomyOrderRealtimeService.ts",
    );

    expect(trackingHookSource).toContain("GastronomyOrderRealtimeService.subscribeOrderTracking");
    expect(realtimeServiceSource).toContain('table: "ride_requests"');
    expect(realtimeServiceSource).toContain("filter: `source_id=eq.${orderId}`");
    expect(trackingHookSource).toContain("source_type");
    expect(trackingHookSource).toContain("newSourceType === 'gastronomy' || oldSourceType === 'gastronomy'");
    expect(trackingHookSource).toContain("refetchInterval: (query) => {");
    expect(trackingHookSource).toContain("query.state.data");
    expect(trackingHookSource).toContain("return 15000");
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

  it("keeps trust notifications with canonical audience URLs", () => {
    const trustSource = readProjectFile("src/core/trust/services/TrustEventService.ts");

    expect(trustSource).toContain("const subjectActionUrl = linkedEvent ? await trustContextActionUrl(linkedEvent) : \"/conta\"");
    expect(trustSource).toContain("const adminActionUrl = \"/admin/moderacao\"");
    expect(trustSource).toContain("action_url: subjectActionUrl");
    expect(trustSource).toContain("action_url: adminActionUrl");
    expect(trustSource).toContain("action_label: \"Ver contexto\"");
    expect(trustSource).toContain("action_label: \"Ver fila\"");
    expect(trustSource).toContain('metadata: { ...baseMetadata, audience: "subject" }');
    expect(trustSource).toContain('metadata: { ...baseMetadata, audience: "actor" }');
    expect(trustSource).toContain('metadata: { ...metadata, audience: "subject" }');
    expect(trustSource).toContain('metadata: { ...metadata, audience: "admin" }');
  });

  it("enforces transactional notification category across delivery and trust flows", () => {
    const deliveryNotificationSource = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliveryNotificationService.ts",
    );
    const notificationServiceSource = readProjectFile(
      "src/core/notifications/services/NotificationService.ts",
    );
    const trustSource = readProjectFile("src/core/trust/services/TrustEventService.ts");
    const sqlSource = readProjectFile(
      "supabase/migrations/20260511183000_create_notification_transactional_preference.sql",
    );

    expect(deliveryNotificationSource).toContain('category: "transactional"');
    expect(deliveryNotificationSource).toContain('metadata: { ...metadata, audience: "customer" }');
    expect(deliveryNotificationSource).toContain('metadata: { ...metadata, audience: "merchant" }');
    expect(deliveryNotificationSource).toContain('metadata: { ...metadata, audience: "courier" }');
    expect(deliveryNotificationSource).toContain("NotificationService.createNotification");
    expect(deliveryNotificationSource).toContain("type: payload.type");
    expect(deliveryNotificationSource).toContain("category: payload.category");
    expect(notificationServiceSource).toContain("p_type: input.type");
    expect(notificationServiceSource).toContain("p_category: input.category || 'social'");
    expect(deliveryNotificationSource).not.toContain('p_category: "system"');
    expect(deliveryNotificationSource).not.toContain('p_type: "order_update"');

    expect(trustSource).toContain('category: "transactional"');
    expect(trustSource).not.toContain('category: "system"');

    expect(sqlSource).toContain("IF p_category = 'transactional' AND NOT v_preferences.transactional_enabled THEN");
    expect(sqlSource).toContain("RETURN NULL;");
  });

  it("enforces delivery eligibility check before creating delivery orders", () => {
    const checkoutHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts",
    );

    expect(checkoutHookSource).toContain("DeliveryAreaService.checkEligibility");
    expect(checkoutHookSource).toContain("if (!eligibilityResult.data.is_eligible)");
    expect(checkoutHookSource).toContain("Este endereço está fora da área de entrega deste estabelecimento.");
    expect(checkoutHookSource).toContain("if (input.business.gastronomy_profile.delivery_enabled)");
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
    const formModelSource = readProjectFile(
      "src/modules/business/gastronomy/components/menu/ItemForm.model.ts",
    );
    const formFieldsSource = readProjectFile(
      "src/modules/business/gastronomy/components/menu/ItemFormFields.tsx",
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

    const fullFormSource = `${formSource}\n${formModelSource}\n${formFieldsSource}`;

    expect(fullFormSource).toContain('name="is_available"');
    expect(fullFormSource).toContain('name="stock_quantity"');
    expect(fullFormSource).toContain('name="stock_alert_threshold"');
    expect(formModelSource).toContain("stock_quantity: item?.stock_quantity ?? undefined");
    expect(formModelSource).toContain("stock_alert_threshold: item?.stock_alert_threshold ?? undefined");
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
