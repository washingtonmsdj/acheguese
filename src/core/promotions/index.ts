/**
 * Contrato canonico de promotions para consumo cross-domain.
 *
 * Centraliza o acesso a anuncios patrocinados sem expor outros dominios
 * a detalhes internos de `modules/promotions`.
 */

export { useAdDelivery } from "@/core/promotions/hooks/useAdDelivery";
export { SponsoredAdCard, SponsoredAdCardEnhanced } from "@/core/promotions/components";
export {
  adDeliveryService,
  AdDeliveryService,
} from "@/core/promotions/services/AdDeliveryService";

export type {
  AdCampaign,
  AdCampaignStatus,
  AdCampaignWithTargets,
  AdEligibilityContext,
  AdOwnerEntityType,
  AdPlacementKey,
  AdResolutionResult,
  AdTarget,
  AdTargetScope,
} from "@/core/promotions/types";
