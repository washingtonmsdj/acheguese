/**
 * Community Issues Module — Barrel Export
 *
 * API pública do módulo. Internals não são exportados.
 *
 * REGRA DE COMPOSIÇÃO:
 * - community/ pode importar componentes deste barrel
 * - community/ NÃO pode importar services ou hooks deste módulo diretamente
 * - community-alerts/ não importa nada deste módulo
 */

// ============================================================================
// Components (API pública para composição em community/)
// ============================================================================
export { IssueFeedSection } from "./components/IssueFeedSection";
export { IssueCard } from "./components/IssueCard";
export { CreateIssueModal } from "./components/CreateIssueModal";

// ============================================================================
// Hooks (internos ao módulo — não usar fora de community-issues/)
// ============================================================================
export { useIssues } from "./hooks/useIssues";
export { useCreateIssue } from "./hooks/useCreateIssue";
export { useIssueSupport } from "./hooks/useIssueSupport";

// ============================================================================
// Config (feature flag e labels — consumidos por outros módulos)
// ============================================================================
export {
  COMMUNITY_ISSUES_ENABLED,
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_REPORT_REASON_LABELS,
} from "./config/issueConfig";

// ============================================================================
// Types
// ============================================================================
export type {
  IssueCategory,
  IssueStatus,
  IssuePriority,
  IssueReportReason,
  CommunityIssue,
  CommunityIssuePublic,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueFeedFilters,
  IssueRpcResult,
  IssueRpcError,
} from "./domain/types";
