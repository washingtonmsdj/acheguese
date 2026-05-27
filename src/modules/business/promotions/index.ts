/**
 * Contrato canonico de promotions para consumo cross-domain.
 *
 * Centraliza o acesso a anuncios patrocinados sem expor outros dominios
 * a detalhes internos de `modules/promotions`.
 */

export { useAdDelivery } from "@/modules/business/promotions/hooks/useAdDelivery";
export { SponsoredAdCard } from "@/modules/business/promotions/components";
export {
  adDeliveryService,
  AdDeliveryService,
} from "@/modules/business/promotions/services/AdDeliveryService";

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
} from "@/modules/business/promotions/types";

