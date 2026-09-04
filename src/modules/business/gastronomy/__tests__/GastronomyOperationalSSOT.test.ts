import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy operational SSOT flow", () => {
  it("keeps merchant order details reachable as a nested Central route", () => {
    const centralRoutesSource = readProjectFile(
      "src/app/routes/sections/CentralRoutes.tsx",
    );

    const gastronomyRouteIndex = centralRoutesSource.indexOf(
      '<Route path="gastronomia">',
    );
    const ordersRouteIndex = centralRoutesSource.indexOf(
      '<Route path="pedidos">',
      gastronomyRouteIndex,
    );
    const orderDetailsRouteIndex = centralRoutesSource.indexOf(
      '<Route path=":orderId" element={<P.OrderDetailsPage />} />',
      ordersRouteIndex,
    );

    expect(gastronomyRouteIndex).toBeGreaterThanOrEqual(0);
    expect(ordersRouteIndex).toBeGreaterThan(gastronomyRouteIndex);
    expect(orderDetailsRouteIndex).toBeGreaterThan(ordersRouteIndex);
  });

  it("keeps customer order details reachable outside merchant Central", () => {
    const routesSource = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const notificationSource = readProjectFile(
      "supabase/migrations/20260714115000_migrate_mobility_admin_notifications.sql",
    );

    expect(routesSource).toMatch(
      /gastronomyPublicRoutes\.orderDetails\(\s*GASTRONOMY_PUBLIC_ROUTE_PARAMS\.orderId,?\s*\)/,
    );
    expect(routesSource).toContain("<P.OrderDetailsPage />");
    expect(
      routesSource.indexOf("gastronomyPublicRoutes.orderDetails("),
    ).toBeLessThan(
      routesSource.indexOf(
        "buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.gastronomy)",
      ),
    );
    expect(notificationSource).toContain("v_customer_url");
    expect(notificationSource).toContain(
      "'/gastronomia/pedidos/' || NEW.id::TEXT",
    );
    expect(notificationSource).toContain(
      "CASE WHEN v_customer_url IS NOT NULL THEN 'Abrir pedido' ELSE NULL END",
    );
    expect(notificationSource).toContain("'/central/motoboy/entregas'");
    expect(notificationSource).toContain("v_idempotency_key");
    expect(notificationSource).toContain("'event_label', v_event_label");
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
    const realtimeRegistrySource = readProjectFile(
      "src/core/realtime/config/realtimeRegistry.ts",
    );

    expect(ordersHookSource).toContain(
      "GastronomyOrderRealtimeService.subscribeBusinessOrders",
    );
    expect(realtimeServiceSource).toContain('"gastronomy.business-orders"');
    expect(realtimeRegistrySource).toContain('"gastronomy.business-orders"');
    expect(realtimeRegistrySource).toContain('table: "orders"');
    expect(realtimeRegistrySource).toContain('column: "source_id"');
    expect(ordersHookSource).toContain("setTimeout(() => {");
    expect(ordersHookSource).not.toContain("verifiedBusinessOrderIdsRef");
    expect(orderDetailsHookSource).toContain(
      "GastronomyOrderRealtimeService.subscribeOrderDetails",
    );
    expect(realtimeServiceSource).toContain('"gastronomy.order-details"');
    expect(realtimeRegistrySource).toContain('"gastronomy.order-details"');
    expect(realtimeRegistrySource).toContain('table: "order_timeline_events"');
    expect(realtimeRegistrySource).toContain('column: "order_id"');
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
    const realtimeRegistrySource = readProjectFile(
      "src/core/realtime/config/realtimeRegistry.ts",
    );

    expect(trackingHookSource).toContain(
      "GastronomyOrderRealtimeService.subscribeOrderTracking",
    );
    expect(realtimeServiceSource).toContain('"gastronomy.order-tracking"');
    expect(realtimeRegistrySource).toContain('"gastronomy.order-tracking"');
    expect(realtimeRegistrySource).toContain('table: "ride_requests"');
    expect(realtimeRegistrySource).toContain('column: "source_id"');
    expect(trackingHookSource).toContain("source_type");
    expect(trackingHookSource).toContain(
      "newSourceType === 'gastronomy' || oldSourceType === 'gastronomy'",
    );
    expect(trackingHookSource).toContain("refetchInterval: (query) => {");
    expect(trackingHookSource).toContain("query.state.data");
    expect(trackingHookSource).toContain("return 15000");
  });

  it("uses the canonical review service and private trust SSOT after delivery", () => {
    const panelSource = readProjectFile(
      "src/modules/business/gastronomy/components/orders/OrderPublicReviewPanel.tsx",
    );
    const trustMigrationSource = readProjectFile(
      "supabase/migrations/20260715109000_consolidate_trust_commands.sql",
    );

    expect(panelSource).toContain("ReviewQueryService.createReview");
    expect(panelSource).toContain("ReviewQueryService.canUserReviewBusiness");
    expect(panelSource).toContain(
      "profiles.find((profile) => profile.id === order.customer_id)",
    );
    expect(panelSource).toContain(
      "const reviewerProfileId = customerProfile?.id ?? null",
    );
    expect(panelSource).toContain(
      "businessProfileId: order.merchant_profile_id",
    );
    expect(panelSource).toContain("reviewerProfileId");
    expect(panelSource).toContain(
      "reviewed_profile_id: order.merchant_profile_id",
    );
    expect(panelSource).toContain("reviewer_profile_id: reviewerProfileId");
    expect(panelSource).not.toContain("businessProfileId: order.business_id");
    expect(panelSource).not.toContain("reviewed_profile_id: order.business_id");
    expect(panelSource).not.toContain("reviewer_profile_id: activeProfile.id");
    expect(panelSource).not.toContain("TrustEventService");
    expect(panelSource).not.toContain("OperationalTrustCommandService");
    expect(panelSource).not.toContain(".from('reviews')");
    expect(panelSource).not.toContain('.from("reviews")');
    expect(panelSource).not.toContain(".from('trust_events')");
    expect(panelSource).not.toContain('.from("trust_events")');
    expect(trustMigrationSource).toContain(
      "CREATE OR REPLACE FUNCTION private.sync_order_review_trust_event()",
    );
    expect(trustMigrationSource).toContain(
      "CREATE TRIGGER trg_sync_order_review_trust_event",
    );
    expect(trustMigrationSource).toContain(
      "PERFORM set_config('achegue.trusted_trust_command', '1', TRUE)",
    );
  });

  it("does not call authenticated favorite counters from anonymous public detail pages", () => {
    const favoritesHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useFavorites.ts",
    );

    expect(favoritesHookSource).toContain("options?: { enabled?: boolean }");
    expect(favoritesHookSource).toContain(
      "enabled: options?.enabled !== false && isValidUUID(businessId)",
    );
    expect(favoritesHookSource).toContain(
      "const favoritesCount = useBusinessFavoritesCount(businessId ?? '', {",
    );
    expect(favoritesHookSource).toContain("enabled: !!businessId");
  });

  it("keeps trust notifications with canonical audience URLs", () => {
    const trustSource = readProjectFile(
      "supabase/migrations/20260714114000_migrate_social_work_trust_notifications.sql",
    );

    expect(trustSource).toContain("private.trust_notification_action_url");
    expect(trustSource).toContain("v_subject_action_url TEXT := '/conta'");
    expect(trustSource).toContain("'/admin/moderacao'");
    expect(trustSource).toContain("'Ver contexto'");
    expect(trustSource).toContain("'Ver fila'");
    expect(trustSource).toContain("'audience', 'subject'");
    expect(trustSource).toContain("'audience', 'actor'");
    expect(trustSource).toContain("'audience', 'admin'");
  });

  it("enforces transactional notification category across delivery and trust flows", () => {
    const deliveryNotificationSource = readProjectFile(
      "supabase/migrations/20260714115000_migrate_mobility_admin_notifications.sql",
    );
    const notificationServiceSource = readProjectFile(
      "src/core/notifications/services/NotificationService.ts",
    );
    const trustSource = readProjectFile(
      "supabase/migrations/20260714114000_migrate_social_work_trust_notifications.sql",
    );
    const sqlSource = readProjectFile(
      "supabase/migrations/20260714113000_create_notification_outbox_core.sql",
    );

    expect(deliveryNotificationSource).toContain("'transactional'");
    expect(deliveryNotificationSource).toContain(
      "v_metadata || jsonb_build_object('audience', 'customer')",
    );
    expect(deliveryNotificationSource).toContain(
      "v_metadata || jsonb_build_object('audience', 'merchant')",
    );
    expect(deliveryNotificationSource).toContain(
      "v_metadata || jsonb_build_object('audience', 'courier')",
    );
    expect(deliveryNotificationSource).toContain(
      "private.enqueue_notification(",
    );
    expect(notificationServiceSource).toContain("p_type: input.type");
    expect(notificationServiceSource).toContain(
      'p_category: input.category ?? "social"',
    );
    expect(deliveryNotificationSource).not.toContain("'system',");

    expect(trustSource).toContain("'transactional'");

    expect(sqlSource).toContain("p_category = 'transactional'");
    expect(sqlSource).toContain("RETURN NULL;");
  });

  it("enforces delivery eligibility check before creating delivery orders", () => {
    const checkoutHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts",
    );
    const checkoutServiceSource = readProjectFile(
      "src/modules/business/gastronomy/services/GastronomyCheckoutService.ts",
    );

    expect(checkoutServiceSource).toContain(
      "DeliveryAreaService.checkEligibility",
    );
    expect(checkoutServiceSource).toContain(
      "if (!eligibilityResult.data.is_eligible)",
    );
    expect(checkoutServiceSource).toContain(
      "eligibilityResult.data.message ||",
    );
    expect(checkoutHookSource).toContain("if (isDeliveryOrder)");
    expect(checkoutHookSource).toContain("resolveDeliveryLocationInfo");
    expect(checkoutHookSource).not.toContain(
      "DeliveryAreaService.checkEligibility",
    );
  });

  it("keeps the official gastronomy checkout restricted to own fleet", () => {
    const checkoutHookSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts",
    );
    const setupPageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomySetupPage.tsx",
    );
    const checkoutRulesSource = readProjectFile(
      "src/modules/business/gastronomy/checkout/checkoutRules.ts",
    );

    expect(checkoutHookSource).toContain(
      'deliveryFulfillmentMode === "platform_courier"',
    );
    expect(checkoutHookSource).toContain(
      "Ajuste a loja para frota própria ou use retirada/no local.",
    );
    expect(checkoutHookSource).not.toContain("useMotoboy");
    expect(checkoutHookSource).not.toContain("requestDelivery(");
    expect(setupPageSource).toContain('delivery_fulfillment_mode: "own_fleet"');
    expect(setupPageSource).not.toContain('"platform_courier"');
    expect(checkoutRulesSource).toContain(
      "export function isPlatformCourierCheckoutAvailable(): boolean {",
    );
    expect(checkoutRulesSource).toContain("return false;");
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

  it("keeps launch-paused beta pages out of the gastronomy runtime module", () => {
    const pageBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/pages/index.ts",
    );
    const componentBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/components/index.ts",
    );
    const rootBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/index.ts",
    );
    const hooksBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/index.ts",
    );
    const nichesBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/niches/index.ts",
    );
    const nicheVersioningBarrelSource = readProjectFile(
      "src/modules/business/gastronomy/niches/versioning/index.ts",
    );
    const centralLazyImportsSource = readProjectFile(
      "src/app/routes/centralLazyImports.ts",
    );
    const appLazyImportsSource = readProjectFile(
      "src/app/routes/lazyImports.ts",
    );

    [
      "src/modules/business/gastronomy/pages/DeliveryManagementPage.tsx",
      "src/modules/business/gastronomy/pages/AnalyticsPage.tsx",
      "src/modules/business/gastronomy/pages/GastronomyPromotionsPage.tsx",
      "src/modules/business/gastronomy/pages/GastronomyPlansPage.tsx",
      "src/modules/business/gastronomy/pages/OperationalDashboardPage.tsx",
      "src/modules/business/gastronomy/components/analytics/AnalyticsOverviewCard.tsx",
      "src/modules/business/gastronomy/components/analytics/AnalyticsChartCard.tsx",
      "src/modules/business/gastronomy/components/analytics/AnalyticsEngagementCard.tsx",
      "src/modules/business/gastronomy/hooks/useAnalytics.ts",
      "src/modules/business/gastronomy/components/GastronomyVerticalCTA.tsx",
      "src/modules/business/gastronomy/components/GastronomyContactSidebar.tsx",
      "src/modules/business/gastronomy/components/GastronomyOwnerDashboard.tsx",
      "src/modules/business/gastronomy/components/GastronomyPhotoGallery.tsx",
      "src/modules/business/gastronomy/components/GastronomyQuickActions.tsx",
      "src/modules/business/gastronomy/components/GastronomyVerticalStatus.tsx",
      "src/modules/business/gastronomy/components/dashboard/TodayOrdersCard.tsx",
      "src/modules/business/gastronomy/components/dashboard/DeliverySummaryCard.tsx",
      "src/modules/business/gastronomy/components/delivery/DeliveryStatsWidget.tsx",
      "src/modules/business/gastronomy/hooks/useMenuVariations.ts",
      "src/modules/business/gastronomy/hooks/useMenuAddons.ts",
      "src/modules/business/gastronomy/hooks/useDeliveryEligibility.ts",
      "src/modules/business/gastronomy/hooks/useGastronomyPreview.ts",
      "src/modules/business/gastronomy/hooks/useGastronomySimilar.ts",
      "src/modules/business/gastronomy/hooks/useSubscriptionManagement.ts",
      "src/modules/business/gastronomy/hooks/useMenuItem.ts",
      "src/modules/business/gastronomy/components/GastronomyHero.tsx",
      "src/modules/business/gastronomy/components/GastronomyCTA.tsx",
      "src/modules/business/gastronomy/components/GastronomyFilters.tsx",
      "src/modules/business/gastronomy/components/GastronomyCategoryCards.tsx",
      "src/modules/business/gastronomy/components/DeliveryInfoCard.tsx",
      "src/modules/business/gastronomy/components/OpeningStatusBadge.tsx",
      "src/modules/business/gastronomy/components/MenuCategoryTabs.tsx",
      "src/modules/business/gastronomy/services/GastronomyMapService.ts",
      "src/modules/business/gastronomy/services/gastronomy-subscription.service.ts",
      "src/modules/business/gastronomy/services/gastronomy.mutations.ts",
      "src/modules/business/gastronomy/services/menu.mutations.ts",
      "src/modules/business/gastronomy/constants/subscription-status.ts",
      "src/modules/business/gastronomy/__mocks__",
      "src/modules/business/gastronomy/dev",
      "src/modules/business/gastronomy/niches/versioning/examples",
      "src/modules/business/gastronomy/niches/components/NicheSelector.tsx",
      "src/modules/business/gastronomy/niches/components/NicheCapabilitiesList.tsx",
      "src/modules/business/gastronomy/niches/components/index.ts",
      "src/modules/business/gastronomy/niches/hooks/useGastronomyNiche.ts",
      "src/modules/business/gastronomy/niches/versioning/components/NicheUpgradeBanner.tsx",
      "src/modules/business/gastronomy/niches/versioning/components/AdminSectionGuard.tsx",
      "src/modules/business/gastronomy/niches/versioning/components/index.ts",
      "src/modules/business/gastronomy/niches/versioning/hooks/useNicheVersioning.ts",
      "src/modules/business/gastronomy/niches/versioning/hooks/useAdminSections.ts",
      "src/modules/business/gastronomy/niches/versioning/hooks/index.ts",
      "src/modules/business/gastronomy/services/GastronomyPublicPreviewService.ts",
      "src/modules/business/gastronomy/__tests__/GastronomyPublicPreviewService.spec.ts",
    ].forEach((path) => {
      expect(existsSync(resolve(repoRoot, path))).toBe(false);
    });

    expect(pageBarrelSource).not.toContain("DeliveryManagementPage");
    expect(pageBarrelSource).not.toContain("AnalyticsPage");
    expect(pageBarrelSource).not.toContain("GastronomyPromotionsPage");
    expect(componentBarrelSource).not.toContain("AnalyticsOverviewCard");
    expect(componentBarrelSource).not.toContain("AnalyticsChartCard");
    expect(componentBarrelSource).not.toContain("AnalyticsEngagementCard");
    expect(hooksBarrelSource).not.toContain("useAnalyticsMetrics");
    expect(hooksBarrelSource).not.toContain("useDailyMetrics");
    expect(hooksBarrelSource).not.toContain("useTrackEvent");
    expect(hooksBarrelSource).not.toContain("useMenuVariations");
    expect(hooksBarrelSource).not.toContain("useMenuAddons");
    expect(hooksBarrelSource).not.toContain("useDeliveryEligibility");
    expect(hooksBarrelSource).not.toContain("useGastronomyPreview");
    expect(hooksBarrelSource).not.toContain("useGastronomySimilar");
    expect(hooksBarrelSource).not.toContain("useSubscriptionManagement");
    expect(componentBarrelSource).not.toContain("GastronomyVerticalCTA");
    expect(componentBarrelSource).not.toContain("TodayOrdersCard");
    expect(componentBarrelSource).not.toContain("DeliverySummaryCard");
    [
      "GastronomyHero",
      "GastronomyCTA",
      "GastronomyFilters",
      "GastronomyCategoryCards",
      "DeliveryInfoCard",
      "OpeningStatusBadge",
      "MenuCategoryTabs",
    ].forEach((removedExport) => {
      expect(componentBarrelSource).not.toContain(removedExport);
      expect(rootBarrelSource).not.toContain(removedExport);
    });
    expect(rootBarrelSource).not.toContain("export * from './pages'");
    expect(nichesBarrelSource).not.toContain("useGastronomyNiche");
    expect(nichesBarrelSource).not.toContain("./hooks/useGastronomyNiche");
    expect(nicheVersioningBarrelSource).not.toContain("./components");
    expect(nicheVersioningBarrelSource).not.toContain("./hooks");
    expect(
      readProjectFile("src/modules/business/gastronomy/services/index.ts"),
    ).not.toContain("GastronomyPublicPreviewService");
    expect(
      readProjectFile("src/modules/business/gastronomy/services/index.ts"),
    ).not.toContain("GastronomyMapService");
    expect(
      readProjectFile("src/modules/business/gastronomy/services/index.ts"),
    ).not.toContain("gastronomy-subscription");
    expect(
      readProjectFile("src/modules/business/gastronomy/services/index.ts"),
    ).not.toContain("gastronomy.mutations");

    expect(centralLazyImportsSource).toContain(
      'export const DeliveryManagementPage = createLaunchPausedRoute("Entregas")',
    );
    expect(centralLazyImportsSource).toContain(
      'export const AnalyticsPage = createLaunchPausedRoute("Analytics")',
    );
    expect(centralLazyImportsSource).toContain(
      'export const GastronomyPromotionsPage = createLaunchPausedRoute("Promocoes")',
    );
    expect(appLazyImportsSource).toContain(
      'export const DeliveryManagementPage = createLaunchPausedRoute("Entregas")',
    );
    expect(appLazyImportsSource).toContain(
      'export const AnalyticsPage = createLaunchPausedRoute("Analytics")',
    );
    expect(appLazyImportsSource).toContain(
      'export const GastronomyPromotionsPage = createLaunchPausedRoute("Promocoes")',
    );

    [
      ["GastronomySetupPage", "Gastronomia operacional"],
      ["GastronomyDashboardPage", "Gastronomia operacional"],
      ["MenuManagementPage", "Gastronomia operacional"],
      ["BusinessHoursPage", "Gastronomia operacional"],
      ["DeliveryAreaPage", "Gastronomia operacional"],
    ].forEach(([exportName, pausedLabel]) => {
      expect(appLazyImportsSource).toMatch(
        new RegExp(
          `export const ${exportName}\\s*=\\s*createLaunchPausedRoute\\(\\s*"${pausedLabel}"\\s*,?\\s*\\)`,
        ),
      );
      expect(centralLazyImportsSource).toContain(
        `export const ${exportName} = lazy(() =>`,
      );
      expect(centralLazyImportsSource).toContain(
        `@/modules/business/gastronomy/pages/${exportName}`,
      );
    });
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
    expect(formSource).toContain(
      "uses_own_delivery: formData.accepts_delivery",
    );
    expect(formSource).toContain("uses_platform_delivery: false");
    expect(formSource).toContain("Rede da plataforma indisponivel");
    expect(formSource).toContain(
      "A rede de entregadores da plataforma permanece bloqueada no checkout v1.",
    );
    expect(formSource).not.toContain("Rede de Motoboys");
    expect(formSource).not.toContain("Usa rede da plataforma");
    expect(formSource).toContain("disabled={isUpdating}");
    expect(formSource).not.toContain("setConfig");
    expect(formSource).not.toContain("isSettingConfig");
  });

  it("does not show fake operational counters in the merchant dashboard", () => {
    const dashboardSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyDashboardPage.tsx",
    );
    const menuSummarySource = readProjectFile(
      "src/modules/business/gastronomy/components/dashboard/MenuSummaryCard.tsx",
    );
    const quickActionsSource = readProjectFile(
      "src/modules/business/gastronomy/components/dashboard/QuickActionsCard.tsx",
    );
    const planStatusSource = readProjectFile(
      "src/modules/business/gastronomy/components/PlanStatusWidget.tsx",
    );

    expect(dashboardSource).toContain("<OperationalStatusCard");
    expect(dashboardSource).toContain("<MenuSummaryCard");
    expect(dashboardSource).toContain("<QuickActionsCard");
    expect(dashboardSource).toContain("usageStats?.currentMenuItems");
    expect(dashboardSource).not.toContain("usageStats?.currentPromotions");
    expect(dashboardSource).not.toContain("showMobility");
    expect(dashboardSource).not.toContain("Rede de Motoboys");
    expect(dashboardSource).not.toContain(
      "businessManagementRoutes.gastronomyEntregas",
    );
    expect(dashboardSource).not.toContain("showCoupons");
    expect(dashboardSource).not.toContain("showAnalytics");
    expect(dashboardSource).not.toContain(
      "businessManagementRoutes.gastronomyPromocoes",
    );
    expect(dashboardSource).not.toContain(
      "businessManagementRoutes.gastronomyAnalytics",
    );
    expect(quickActionsSource).not.toContain("showMobility");
    expect(quickActionsSource).not.toContain("showAnalytics");
    expect(quickActionsSource).not.toContain("Bike");
    expect(quickActionsSource).not.toContain("gastronomyEntregas");
    expect(quickActionsSource).not.toContain("gastronomyPromocoes");
    expect(quickActionsSource).not.toContain("gastronomyAnalytics");
    expect(planStatusSource).not.toContain("showCoupons");
    expect(planStatusSource).not.toContain("showAnalytics");
    expect(planStatusSource).not.toContain("currentPromotions");
    expect(planStatusSource).not.toContain("Promocoes");
    expect(planStatusSource).not.toContain("Analytics");
    expect(dashboardSource).not.toContain(
      '<span className="font-medium">0</span>',
    );
    expect(dashboardSource).not.toContain(
      '<span className="font-medium text-green-600">Aberto</span>',
    );
    expect(menuSummarySource).toContain("useGastronomyMenuId");
    expect(menuSummarySource).toContain("useMenuCategories(menuId ?? '')");
    expect(menuSummarySource).toContain("useMenuItems(menuId ?? '')");
    expect(menuSummarySource).not.toContain("useMenuCategories(businessId)");
    expect(menuSummarySource).not.toContain("useMenuItems(businessId)");
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
      "src/core/business/services/MenuService.ts",
    );

    const fullFormSource = `${formSource}\n${formModelSource}\n${formFieldsSource}`;

    expect(fullFormSource).toContain('name="is_available"');
    expect(fullFormSource).toContain('name="stock_quantity"');
    expect(fullFormSource).toContain('name="stock_alert_threshold"');
    expect(formModelSource).toContain(
      "stock_quantity: item?.stock_quantity ?? undefined",
    );
    expect(formModelSource).toContain(
      "stock_alert_threshold: item?.stock_alert_threshold ?? undefined",
    );
    expect(cardSource).toContain("const isSoldOut = item.stock_quantity === 0");
    expect(cardSource).toContain("Marcar esgotado");
    expect(cardSource).toContain("onMarkSoldOut");
    expect(pageSource).toContain("handleMarkItemSoldOut");
    expect(pageSource).toContain(
      "updateItem({ itemId, stock_quantity: 0, is_available: false })",
    );
    expect(hookSource).toContain("stock_quantity?: number");
    expect(hookSource).toContain("stock_alert_threshold?: number");
    expect(hookSource).toContain("is_available?: boolean");
    expect(serviceSource).toContain(
      "stockQuantity: input.stock_quantity ?? null",
    );
    expect(serviceSource).toContain(
      "stockAlertThreshold: input.stock_alert_threshold ?? null",
    );
    expect(serviceSource).toContain("is_available: input.is_available ?? true");
    expect(serviceSource).not.toContain(
      "preparation_time_min: input.preparation_time_min || null",
    );
  });
});
