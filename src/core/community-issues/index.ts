/**
 * Contrato canonico de community-issues para consumo cross-domain.
 *
 * Evita que o admin acople direto a implementacoes internas do modulo.
 */

export {
  ISSUE_CATEGORY_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_REPORT_REASON_LABELS,
  ISSUE_STATUS_LABELS,
} from "@/modules/community-issues/config/issueConfig";

export type {
  CommunityIssue,
  CommunityIssuePublic,
  IssueCategory,
  IssuePriority,
  IssueReportReason,
  IssueStatus,
} from "@/modules/community-issues/domain/types";

export {
  CreateIssueModal,
  IssueFeedSection,
} from "@/modules/community-issues";

export { communityIssueService } from "@/modules/community-issues/services/CommunityIssueService";
