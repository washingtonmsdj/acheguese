/**
 * Contrato canonico de promotions para consumo cross-domain.
 *
 * Centraliza o acesso a anuncios patrocinados sem expor outros dominios
 * a detalhes internos de `modules/promotions`.
 */

export { useAdDelivery } from "@/modules/promotions/hooks/useAdDelivery";
export { SponsoredAdCard } from "@/modules/promotions/components/SponsoredAdCard";
export {
  adDeliveryService,
  AdDeliveryService,
} from "@/modules/promotions/services/AdDeliveryService";

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
} from "@/modules/promotions/types";