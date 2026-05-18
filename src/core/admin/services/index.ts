// ✅ SSOT Admin Services Exports
export { adminMobilityService } from "./AdminMobilityService";
export type {
  AdminDriverData,
  AdminRideData,
  AdminRideStats,
  AdminMobilityOperationalFilter,
  AdminMobilityOperationalItem,
  AdminMobilityOperationalSnapshot,
} from "./AdminMobilityService";
export { adminBusinessService } from "./AdminBusinessService";
export type { AdminBusinessData } from "./AdminBusinessService";
export { adminCommunityService } from "./AdminCommunityService";
export type {
  ModerationStats,
  CommunityPost,
  PostFlag,
} from "./AdminCommunityService";
export { adminStatsService } from "./AdminStatsService";
export type { 
  PremiumStats, 
  TableStats, 
  ActivityData, 
  RecentActivity 
} from "./AdminStatsService";
export { adminPickupPointsService } from "./AdminPickupPointsService";
export type {
  PickupPoint,
  CreatePickupPointInput,
} from "./AdminPickupPointsService";

// Additional services exports
export { adminAlertsService } from "./AdminAlertsService";
export type { AdminAlertPost, AdminAlertProfile } from "./AdminAlertsService";
export { adminClassifiedsService } from "./AdminClassifiedsService";
export type {
  AdminClassifiedData,
  ClassifiedCategoryCoverageItem,
  ClassifiedCategoryCoverageResult,
  ClassifiedSellerCoverageItem,
  ClassifiedSellerCoverageResult,
  ClassifiedUrlHistoryItem,
  ClassifiedUrlHistoryResult,
  ClassifiedPolicySummary,
} from "./AdminClassifiedsService";
export { adminCommunityAlertsService } from "./AdminCommunityAlertsService";
export { adminCommunityIssuesService } from "./AdminCommunityIssuesService";
export { adminCouponsService } from "./AdminCouponsService";
export type { CouponData } from "./AdminCouponsService";
export { adminEventsService } from "./AdminEventsService";
export type { AdminEventData } from "./AdminEventsService";
export { adminGastronomyService } from "./AdminGastronomyService";
export { adminMessagingService } from "./AdminMessagingService";
export type { AdminConversationData } from "./AdminMessagingService";
export { adminModerationService } from "./AdminModerationService";
export { adminNotificationsService } from "./AdminNotificationsService";
export type { AdminNotificationRecord } from "./AdminNotificationsService";
export { adminPromotionsService } from "./AdminPromotionsService";
export { adminRolesService } from "./AdminRolesService";
export { adminSubscriptionsService } from "./AdminSubscriptionsService";
export { adminVagasService } from "./AdminVagasService";
export { adminProfileGovernanceService } from "./AdminProfileGovernanceService";
export type {
  AdminProfileIdentityRecord,
  AdminProfileIdentityListResult,
  AdminProfileIdentityStats,
  AdminProfileIdentityFilters,
  AdminProfileIdentityDetail,
  AdminProfileFamilySummary,
  AdminProfilePreferenceScopeSummary,
  AdminProfilePreferenceFieldSummary,
  AdminProfileReputationSourceSummary,
  AdminProfileResidenceSummary,
  AdminProfilePermissionGovernanceSummary,
  AdminProfileIdentityIssue,
} from "./AdminProfileGovernanceService";
export { adminMapGovernanceService } from "./AdminMapGovernanceService";
export { AdminMotoboyOperationsService } from "./AdminMotoboyOperationsService";
export { AdminDriverModerationService } from "./AdminDriverModerationService";
export { AdminUserDetailService } from "./AdminUserDetailService";
export type {
  AdminMapGovernanceIssue,
  AdminMapGovernanceStats,
  AdminMapProviderSummary,
  AdminMapLayerSummary,
  AdminMapCoverageSummary,
  AdminMapTouristPointCategorySummary,
  AdminMapGovernanceHotspot,
  AdminMapGovernanceSnapshot,
  AdminMapHotspotResolutionResult,
} from "./AdminMapGovernanceService";
