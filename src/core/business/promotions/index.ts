/**
 * Canonical cross-domain entrypoint for sponsored promotion delivery.
 */
export { useAdDelivery } from '@/core/business/promotions/hooks/useAdDelivery';
export { SponsoredAdCard } from '@/core/business/promotions/components';
export {
  adDeliveryService,
  AdDeliveryService,
} from '@/core/business/promotions/services/AdDeliveryService';
export {
  AdCampaignRequestService,
} from '@/core/business/promotions/services/AdCampaignRequestService';
export {
  AdCampaignAdminService,
} from '@/core/business/promotions/services/AdCampaignAdminService';
export { AD_CAMPAIGN_STATUS } from '@/core/business/promotions/config/adCampaignStatus';
export type {
  AdCampaignRequestInput,
  AdCampaignTerritoryType,
  BusinessAdCampaignSummary,
} from '@/core/business/promotions/services/AdCampaignRequestService';
export type {
  AdminAdCampaignListParams,
  AdminAdCampaignListResult,
  AdminAdCampaignStateInput,
  AdminAdCampaignStats,
  AdminAdCampaignSummary,
} from '@/core/business/promotions/services/AdCampaignAdminService';
export type {
  AdCampaign,
  AdCampaignBillingStatus,
  AdCampaignReviewStatus,
  AdCampaignSource,
  AdCampaignStatus,
  AdCampaignWithTargets,
  AdEligibilityContext,
  AdPlacementKey,
  AdResolutionResult,
  AdTarget,
  AdTargetScope,
} from '@/core/business/promotions/types';
