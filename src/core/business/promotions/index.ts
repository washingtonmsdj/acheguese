/**
 * Canonical cross-domain entrypoint for sponsored promotion delivery.
 */
export { useAdDelivery } from '@/core/business/promotions/hooks/useAdDelivery';
export { SponsoredAdCard } from '@/core/business/promotions/components';
export {
  adDeliveryService,
  AdDeliveryService,
} from '@/core/business/promotions/services/AdDeliveryService';
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
} from '@/core/business/promotions/types';
