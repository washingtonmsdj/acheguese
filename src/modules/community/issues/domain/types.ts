/**
 * Community Issues - Tipos de dominio
 */

export type IssueCategory =
  | "buraco_via"
  | "calcada_danificada"
  | "iluminacao_publica"
  | "lixo_acumulado"
  | "alagamento_cronico"
  | "arvore_risco"
  | "sinalizacao_danificada"
  | "esgoto_aberto"
  | "pichacao_vandalismo"
  | "outro";

export type IssueStatus =
  | "aberto"
  | "em_analise"
  | "em_andamento"
  | "resolvido"
  | "rejeitado";

export type IssuePriority = "baixa" | "media" | "alta" | "urgente";

export type IssueReportReason =
  | "duplicate"
  | "false_report"
  | "inappropriate_content"
  | "spam"
  | "other";

export type IssueAuditAction =
  | "created"
  | "updated"
  | "status_changed"
  | "supported"
  | "reported"
  | "reviewed_cleared"
  | "removed";

export interface CommunityIssue {
  id: string;
  author_profile_id: string;
  location_id: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  title: string;
  description: string;
  images?: string[];
  neighborhood: string;
  neighborhood_display: string;
  city: string;
  address_reference?: string;
  support_count: number;
  comments_count: number;
  report_count: number;
  under_review: boolean;
  removed_at?: string;
  removal_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export type CommunityIssuePublic = Omit<CommunityIssue, "removal_reason" | "under_review">;

export interface CreateIssuePayload {
  category: IssueCategory;
  title: string;
  description: string;
  location_id: string;
  images?: string[];
  address_reference?: string;
  priority?: IssuePriority;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  images?: string[];
  address_reference?: string;
}

export interface IssueSupport {
  id: string;
  issue_id: string;
  profile_id: string;
  created_at: string;
}

export interface CommunityIssueReport {
  id: string;
  issue_id: string;
  reporter_profile_id: string;
  reason: IssueReportReason;
  created_at: string;
}

export interface CreateIssueReportPayload {
  issue_id: string;
  reason: IssueReportReason;
}

export interface CommunityIssueAudit {
  id: string;
  issue_id: string;
  actor_id: string;
  action_type: IssueAuditAction;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface IssueFeedFilters {
  location_id?: string;
  location_ids?: string[];
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
}

export type IssueRpcError =
  | "not_authenticated"
  | "profile_not_found"
  | "location_id_required"
  | "location_not_found"
  | "location_must_be_district"
  | "rate_limit_exceeded"
  | "invalid_category"
  | "invalid_title_length"
  | "invalid_description_length"
  | "duplicate_issue"
  | "internal_error";

export interface IssueRpcResult {
  success?: boolean;
  issue_id?: string;
  error?: IssueRpcError;
  detail?: string;
}
