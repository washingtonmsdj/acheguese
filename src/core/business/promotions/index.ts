/**
 * Canonical cross-domain entrypoint for sponsored promotion delivery.
 */
export { useAdDelivery } from '@/modules/business/promotions/hooks/useAdDelivery';
export { SponsoredAdCard } from '@/modules/business/promotions/components';
export {
  adDeliveryService,
  AdDeliveryService,
} from '@/modules/business/promotions/services/AdDeliveryService';
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
} from '@/modules/business/promotions/types';
