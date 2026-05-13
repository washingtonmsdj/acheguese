/**
 * ProfileBusinessTypes — Tipos de negócios associados ao perfil
 *
 * Estes tipos descrevem empresas e módulos empresariais no contexto
 * do perfil do usuário. NÃO são a entidade canônica do domínio Business.
 *
 * A entidade canônica de Business vive em src/core/business/.
 * Estes tipos são read models específicos do ProfileService.
 *
 * Usado por:
 * - ProfileService.getPrivateWorkspace() (retorna businessModules)
 * - useContaWorkspace, useProfileHub (consomem businessModules)
 * - BusinessList, FavoritesList, ContentTabsSection (exibem businesses)
 * - BusinessOwnerQuickAccess, BusinessModulesSection (exibem módulos)
 *
 * @version 1.0.0
 */

// ── Business associado ao perfil ─────────────────────────────────────────

/**
 * ProfileAssociatedBusiness — Empresa associada ao perfil do usuário
 *
 * Read model retornado por ProfileService para exibição no hub de perfil.
 * Não é a entidade canônica de Business — é um snapshot para UI.
 *
 * @see src/core/business/ para a entidade canônica
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

// ── Módulos empresariais ─────────────────────────────────────────────────

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
 * ProfileBusinessModuleSnapshot — Módulo empresarial no hub de perfil
 *
 * Agrega dados de dashboard, subscription, gastronomy e QR
 * para exibição no hub de perfil do dono da empresa.
 *
 * Não é a entidade canônica de Business — é um snapshot agregado.
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
