/**
 * Community Issues — Configuração centralizada
 *
 * Todos os valores configuráveis ficam aqui.
 * Nenhum valor hardcoded em componentes ou services.
 */

import type { IssueCategory, IssueStatus, IssuePriority, IssueReportReason } from "../domain/types";

// ============================================================================
// FEATURE FLAG
// ============================================================================

export const COMMUNITY_ISSUES_ENABLED =
  (import.meta.env.VITE_FEATURE_COMMUNITY_ISSUES ?? "false") === "true";

// ============================================================================
// LABELS DE CATEGORIA (pt-BR)
// ============================================================================

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  buraco_via:             "Buraco na via",
  calcada_danificada:     "Calçada danificada",
  iluminacao_publica:     "Iluminação pública",
  lixo_acumulado:         "Lixo acumulado",
  alagamento_cronico:     "Alagamento crônico",
  arvore_risco:           "Árvore em risco",
  sinalizacao_danificada: "Sinalização danificada",
  esgoto_aberto:          "Esgoto aberto",
  pichacao_vandalismo:    "Pichação / Vandalismo",
  outro:                  "Outro",
};

// ============================================================================
// LABELS DE STATUS (pt-BR)
// ============================================================================

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  aberto:       "Aberto",
  em_analise:   "Em análise",
  em_andamento: "Em andamento",
  resolvido:    "Resolvido",
  rejeitado:    "Rejeitado",
};

// ============================================================================
// LABELS DE PRIORIDADE (pt-BR)
// ============================================================================

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  baixa:   "Baixa",
  media:   "Média",
  alta:    "Alta",
  urgente: "Urgente",
};

// ============================================================================
// LABELS DE MOTIVO DE REPORT (pt-BR)
// ============================================================================

export const ISSUE_REPORT_REASON_LABELS: Record<IssueReportReason, string> = {
  duplicate:             "Problema duplicado",
  false_report:          "Relato falso",
  inappropriate_content: "Conteúdo inapropriado",
  spam:                  "Spam",
  other:                 "Outro motivo",
};

// ============================================================================
// REGRAS DE NEGÓCIO
// ============================================================================

export const ISSUE_RULES = {
  /** Máximo de issues criados por usuário em 24h */
  MAX_ISSUES_PER_24H: 5,

  /** Mínimo de caracteres no título */
  TITLE_MIN_LENGTH: 10,

  /** Máximo de caracteres no título */
  TITLE_MAX_LENGTH: 100,

  /** Mínimo de caracteres na descrição */
  DESCRIPTION_MIN_LENGTH: 20,

  /** Máximo de caracteres na descrição */
  DESCRIPTION_MAX_LENGTH: 500,

  /** Número de reports para acionar under_review */
  REPORTS_THRESHOLD_REVIEW: 3,

  /** Máximo de imagens por issue */
  MAX_IMAGES: 3,
} as const;
