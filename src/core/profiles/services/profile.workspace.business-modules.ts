import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import type { ProfileBusinessModuleSnapshot } from "./types";

type BusinessWorkspaceInput = {
  id: string;
  name?: string;
  category?: string | null;
  neighborhood?: string;
  city?: string;
  verified?: boolean;
  verificado?: boolean;
  is_premium?: boolean;
  slug?: string;
  geographic_path?: string | null;
};

type BusinessUrlBuilder = (params: {
  id: string;
  slug: string;
  is_premium?: boolean;
  geographic_path: string;
}) => string;

type SubscriptionLike = {
  status?: string | null;
  current_period_end?: string | null;
};

type EntitlementsLike = {
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
};

type GastronomyProfileLike = {
  cuisine_type?: string | null;
  delivery_enabled?: boolean | null;
  dine_in_enabled?: boolean | null;
  takeout_enabled?: boolean | null;
} | null;

type QrCodeLike = {
  is_active?: boolean | null;
  style_variant?: string | null;
  destination_variant?: string | null;
} | null;

export function buildBusinessModuleSnapshot(params: {
  business: BusinessWorkspaceInput;
  planTier: string;
  subscription: SubscriptionLike | null | undefined;
  entitlements: EntitlementsLike;
  gastronomyEligible: boolean;
  gastronomyProfile: GastronomyProfileLike;
  qrCode: QrCodeLike;
  getCanonicalUrl: BusinessUrlBuilder;
  getShareUrl: BusinessUrlBuilder;
}): ProfileBusinessModuleSnapshot {
  const {
    business,
    planTier,
    subscription,
    entitlements,
    gastronomyEligible,
    gastronomyProfile,
    qrCode,
    getCanonicalUrl,
    getShareUrl,
  } = params;

  const publicUrl =
    business.slug && business.geographic_path
      ? getCanonicalUrl({
          id: business.id,
          slug: business.slug,
          is_premium: business.is_premium,
          geographic_path: business.geographic_path,
        })
      : undefined;
  const shareUrl =
    business.slug && business.geographic_path
      ? getShareUrl({
          id: business.id,
          slug: business.slug,
          is_premium: business.is_premium,
          geographic_path: business.geographic_path,
        })
      : undefined;
  const dashboardUrl = businessManagementRoutes.overview(business.id);

  return {
    businessId: business.id,
    name: business.name || "Empresa",
    category: business.category,
    neighborhood: business.neighborhood,
    city: business.city,
    verified: Boolean(business.verified || business.verificado),
    isPremium: Boolean(business.is_premium),
    publicUrl,
    shareUrl,
    dashboardUrl,
    editUrl: `/edit-business/${business.id}`,
    subscription: {
      planTier,
      status: subscription?.status ?? "active",
      currentPeriodEnd: subscription?.current_period_end ?? null,
      canUsePremiumPublicPage: entitlements.canUsePremiumPublicPage,
      canUseShortPremiumLink: entitlements.canUseShortPremiumLink,
      canUseCustomQRCode: entitlements.canUseCustomQRCode,
      canReceiveInternalOrders: entitlements.canReceiveInternalOrders,
      canUseOrdersPanel: entitlements.canUseOrdersPanel,
      canUseMotoboyNetwork: entitlements.canUseMotoboyNetwork,
      canRequestDelivery: entitlements.canRequestDelivery,
      canTrackDelivery: entitlements.canTrackDelivery,
      canConfigureDeliveryArea: entitlements.canConfigureDeliveryArea,
      canSetDeliveryFees: entitlements.canSetDeliveryFees,
      canUseOwnDelivery: entitlements.canUseOwnDelivery,
    },
    gastronomy: {
      eligible: gastronomyEligible,
      active: Boolean(gastronomyProfile),
      status: gastronomyEligible
        ? gastronomyProfile
          ? "active"
          : "setup_required"
        : "not_applicable",
      cuisineType: gastronomyProfile?.cuisine_type ?? null,
      deliveryEnabled: Boolean(gastronomyProfile?.delivery_enabled),
      dineInEnabled: Boolean(gastronomyProfile?.dine_in_enabled),
      takeoutEnabled: Boolean(gastronomyProfile?.takeout_enabled),
      setupUrl: gastronomyEligible
        ? businessManagementRoutes.gastronomySetup(business.id)
        : undefined,
      dashboardUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomia(business.id)
        : undefined,
      menuUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyCardapio(business.id)
        : undefined,
      ordersUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyPedidos(business.id)
        : undefined,
      deliveriesUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyEntregas(business.id)
        : undefined,
      deliveryAreaUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyAreaEntrega(business.id)
        : undefined,
      analyticsUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyAnalytics(business.id)
        : undefined,
      hoursUrl: gastronomyProfile
        ? businessManagementRoutes.gastronomyHorarios(business.id)
        : undefined,
      plansUrl: gastronomyEligible
        ? businessManagementRoutes.planos(business.id)
        : undefined,
    },
    qrCode: {
      hasActive: Boolean(qrCode?.is_active),
      styleVariant: qrCode?.style_variant ?? null,
      destinationVariant: qrCode?.destination_variant ?? null,
      managementUrl: dashboardUrl,
    },
  };
}
