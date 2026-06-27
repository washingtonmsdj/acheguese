/**
 * Profile-associated business read models.
 *
 * These snapshots describe businesses and business modules in the private
 * profile workspace. They are not the canonical Business domain entity.
 * Canonical business behavior belongs to `src/core/business`.
 *
 * Used by:
 * - ProfileService.getPrivateWorkspace() for `businessModules`.
 * - useContaWorkspace and useProfileHub.
 * - FavoritesList and ContentTabsSection for associated businesses.
 * - BusinessOwnerQuickAccess and BusinessModulesSection for business modules.
 */

export interface ProfileAssociatedBusiness {
  id: string;
  name?: string;
  logo?: string;
  category?: string;
  rating?: number;
  neighborhood?: string;
  city?: string;
  verified?: boolean;
  verificado?: boolean;
  slug?: string;
  geographic_path?: string | null;
  is_premium?: boolean;
  aberto?: boolean;
  nicho?: string;
  description?: string;
}

export interface ProfileBusinessSubscriptionSnapshot {
  planTier: string;
  status: string;
  currentPeriodEnd?: string | null;
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
  canUseCustomQRCode: boolean;
  canReceiveInternalOrders: boolean;
  canUseOrdersPanel: boolean;
  canUseMotoboyNetwork: boolean;
  canRequestDelivery: boolean;
  canTrackDelivery: boolean;
  canConfigureDeliveryArea: boolean;
  canSetDeliveryFees: boolean;
  canUseOwnDelivery: boolean;
}

export interface ProfileBusinessGastronomySnapshot {
  eligible: boolean;
  active: boolean;
  status: "not_applicable" | "available" | "setup_required" | "active";
  cuisineType?: string | null;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  takeoutEnabled: boolean;
  setupUrl?: string;
  dashboardUrl?: string;
  operationalUrl?: string;
  menuUrl?: string;
  ordersUrl?: string;
  deliveriesUrl?: string;
  deliveryAreaUrl?: string;
  analyticsUrl?: string;
  billingUrl?: string;
  hoursUrl?: string;
  plansUrl?: string;
}

export interface ProfileBusinessQrSnapshot {
  hasActive: boolean;
  styleVariant?: string | null;
  destinationVariant?: string | null;
  managementUrl: string;
}

/**
 * Aggregated business module snapshot for owner-facing profile UI.
 */
export interface ProfileBusinessModuleSnapshot {
  businessId: string;
  name: string;
  category?: string;
  neighborhood?: string;
  city?: string;
  verified: boolean;
  isPremium: boolean;
  publicUrl?: string;
  shareUrl?: string;
  dashboardUrl: string;
  editUrl: string;
  subscription: ProfileBusinessSubscriptionSnapshot;
  gastronomy: ProfileBusinessGastronomySnapshot;
  qrCode: ProfileBusinessQrSnapshot;
}
