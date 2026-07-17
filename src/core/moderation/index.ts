/**
 * Moderation Services - Barrel Export
 * SSOT v2.0 - Domain services for moderation
 */

export { FederatedModerationQueue } from "./components/FederatedModerationQueue";
export {
  FEDERATED_MODERATION_DOMAINS,
  FEDERATED_MODERATION_STATES,
  federatedModerationQueueService,
  type FederatedModerationCursor,
  type FederatedModerationDomain,
  type FederatedModerationItem,
  type FederatedModerationPage,
  type FederatedModerationState,
} from "./services/FederatedModerationQueueService";
export { ReportReasonDialog } from "./components/ReportReasonDialog";
export {
  COMMUNITY_REPORT_REASON_OPTIONS,
  isReportReason,
  reportReasonOptionsFromLabels,
  type CommunityReportReason,
  type ReportReasonOption,
} from "./reportReasons";
