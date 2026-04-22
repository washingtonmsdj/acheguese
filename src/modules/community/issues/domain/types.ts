/**
 * Community Issues — Tipos de domínio
 *
 * Domínio: problemas urbanos persistentes que requerem ação de responsável externo.
 * NÃO confundir com alertas (imediatos/urgentes) — ver regra de fronteira em ARCHITECTURE.md
 */

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

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

/**
 * Workflow operacional — ciclo de vida do problema.
 * Moderação é tratada em campos separados (under_review, removed_at).
 */
export type IssueStatus =
  | "aberto"       // recém criado, aguardando triagem
  | "em_analise"   // responsável reconheceu o problema
  | "em_andamento" // solução em execução
  | "resolvido"    // problema corrigido e confirmado
  | "rejeitado";   // fora de escopo ou inválido

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

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

/**
 * Entidade completa — shape do banco.
 */
export interface CommunityIssue {
  id: string;
  author_profile_id: string;
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

/**
 * Projeção pública — campos sensíveis removidos.
 */
export type CommunityIssuePublic = Omit<
  CommunityIssue,
  "removal_reason" | "under_review"
>;

/**
 * Dados para criar um problema urbano.
 */
export interface CreateIssuePayload {
  category: IssueCategory;
  title: string;
  description: string;
  images?: string[];
  neighborhood: string;
  city: string;
  address_reference?: string;
  priority?: IssuePriority;
}

/**
 * Dados para atualizar um problema (apenas campos editáveis pelo autor).
 */
export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  images?: string[];
  address_reference?: string;
}

// ============================================================================
// SUPORTE (upvote)
// ============================================================================

export interface IssueSupport {
  id: string;
  issue_id: string;
  profile_id: string;
  created_at: string;
}

// ============================================================================
// REPORT
// ============================================================================

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

// ============================================================================
// AUDIT
// ============================================================================

export interface CommunityIssueAudit {
  id: string;
  issue_id: string;
  actor_id: string;
  action_type: IssueAuditAction;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// FILTROS DE FEED
// ============================================================================

export interface IssueFeedFilters {
  location_id?: string;  // Filtro por location canônico
  city?: string;         // DEPRECATED: mantido para compatibilidade
  neighborhood?: string; // DEPRECATED: mantido para compatibilidade
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
}

// ============================================================================
// RESULTADOS DE OPERAÇÕES
// ============================================================================

export type IssueRpcError =
  | "not_authenticated"
  | "profile_not_found"
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
