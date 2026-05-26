import { PlanTier, type PlanEntitlements } from './types';

/**
 * Runtime entitlement matrix used by synchronous guards.
 *
 * Commercial catalog data stays in BillingPlanService/database. Keep this file
 * limited to deterministic feature flags and limits.
 */
const FREE_ENTITLEMENTS: PlanEntitlements = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  canUseAdvancedMenu: false,
  canUseMenuCategories: false,
  canUseMenuImages: false,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: true,
  canScheduleItems: false,
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: true,
  canSetMinimumOrder: false,
  canUseOwnDelivery: false,
  canUsePromotions: false,
  canUseFeaturedPlacement: false,
  canUseBanners: false,
  canUseCoupons: false,
  canSchedulePromotions: false,
  canUseBasicAnalytics: false,
  canUseAdvancedAnalytics: false,
  canExportReports: false,
  canViewRealtimeMetrics: false,
  canViewCustomerInsights: false,
  maxMenuItems: 20,
  maxPromotions: 0,
  maxImages: 5,
  maxCategories: 3,
  maxCombos: 0,
  maxOrdersPerDay: null,
};

const PRO_ENTITLEMENTS: PlanEntitlements = {
  ...FREE_ENTITLEMENTS,
  canUsePremiumPublicPage: true,
  canUseShortPremiumLink: true,
  canUseCustomQRCode: true,
  canUseAdvancedMenu: true,
  canUseMenuCategories: true,
  canUseMenuImages: true,
  canUseMenuVariations: true,
  canUseMenuAddons: true,
  canUseMenuCombos: true,
  canScheduleItems: true,
  canUsePromotions: true,
  canUseFeaturedPlacement: true,
  canUseCoupons: true,
  canSchedulePromotions: true,
  canUseBasicAnalytics: true,
  canViewRealtimeMetrics: true,
  maxMenuItems: null,
  maxPromotions: 10,
  maxImages: null,
  maxCategories: null,
  maxCombos: 20,
};

const DELIVERY_ENTITLEMENTS: PlanEntitlements = {
  ...PRO_ENTITLEMENTS,
  canReceiveInternalOrders: true,
  canUseOrdersPanel: true,
  canManageOrderStatus: true,
  canCancelOrders: true,
  canViewOrderHistory: true,
  canUseMotoboyNetwork: true,
  canRequestDelivery: true,
  canTrackDelivery: true,
  canConfigureDeliveryArea: true,
  canSetDeliveryFees: true,
  canSetMinimumOrder: true,
  canUseOwnDelivery: true,
  canUseBanners: true,
  canUseAdvancedAnalytics: true,
  canExportReports: true,
  canViewCustomerInsights: true,
  maxPromotions: null,
  maxCombos: null,
};

const ENTITLEMENTS_BY_PLAN: Record<PlanTier, PlanEntitlements> = {
  [PlanTier.FREE]: FREE_ENTITLEMENTS,
  [PlanTier.PRO]: PRO_ENTITLEMENTS,
  [PlanTier.DELIVERY]: DELIVERY_ENTITLEMENTS,
};

export function getBaselineEntitlements(planTier: PlanTier): PlanEntitlements {
  return { ...(ENTITLEMENTS_BY_PLAN[planTier] ?? ENTITLEMENTS_BY_PLAN[PlanTier.FREE]) };
}
