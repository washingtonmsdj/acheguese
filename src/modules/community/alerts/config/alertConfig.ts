/**
 * Community Alerts — Configuração centralizada
 *
 * Todos os valores configuráveis ficam aqui.
 * Nenhum valor hardcoded em componentes ou services.
 */

import type { AlertCategory, AlertStartedApprox, AlertReportReason } from "../domain/types";

// ============================================================================
// FEATURE FLAG
// ============================================================================

export const COMMUNITY_ALERTS_ENABLED =
  (import.meta.env.VITE_FEATURE_COMMUNITY_ALERTS ?? "false") === "true";

// ============================================================================
// EXPIRAÇÃO POR CATEGORIA (em minutos)
// Deve espelhar os valores da RPC SQL (004_rpc_create_alert.sql)
// ============================================================================

export const ALERT_EXPIRY_MINUTES: Record<AlertCategory, number> = {
  tiroteio_disparos:          60,
  assalto_em_andamento:       60,
  tentativa_de_invasao:       60,
  incendio_explosao:          90,
  acidente_grave:             90,
  alagamento_deslizamento:    180,
  risco_na_via:               180,
  pessoa_vulneravel_em_risco: 120,
};

// ============================================================================
// LABELS DE CATEGORIA (pt-BR)
// ============================================================================

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  tiroteio_disparos:          "Tiroteio / Disparos",
  assalto_em_andamento:       "Assalto em andamento",
  tentativa_de_invasao:       "Tentativa de invasão",
  incendio_explosao:          "Incêndio / Explosão",
  acidente_grave:             "Acidente grave",
  alagamento_deslizamento:    "Alagamento / Deslizamento",
  risco_na_via:               "Risco na via",
  pessoa_vulneravel_em_risco: "Pessoa vulnerável em risco",
};

// ============================================================================
// LABELS DE started_at_approx (pt-BR)
// ============================================================================

export const ALERT_STARTED_APPROX_LABELS: Record<AlertStartedApprox, string> = {
  just_now:   "Agora mesmo",
  minutes_5:  "Há ~5 minutos",
  minutes_15: "Há ~15 minutos",
  minutes_30: "Há ~30 minutos",
  over_30:    "Há mais de 30 minutos",
};

// ============================================================================
// LABELS DE MOTIVO DE REPORT (pt-BR)
// ============================================================================

export const ALERT_REPORT_REASON_LABELS: Record<AlertReportReason, string> = {
  false_alert:        "Alerta falso",
  promotes_crime:     "Promove ou facilita crime",
  identifies_person:  "Identifica ou acusa pessoa",
  monitors_operation: "Monitora operação / fiscalização",
  hate_speech:        "Discurso de ódio",
  spam:               "Spam ou conteúdo repetido",
  other:              "Outro motivo",
};

// ============================================================================
// REGRAS DE NEGÓCIO
// ============================================================================

export const ALERT_RULES = {
  /** Máximo de alertas criados por usuário em 24h */
  MAX_ALERTS_PER_24H: 3,

  /** Janela de deduplicação em minutos (mesma categoria + bairro) */
  DEDUP_WINDOW_MINUTES: 30,

  /** Número de reports para acionar under_review */
  REPORTS_THRESHOLD_REVIEW: 3,

  /** Número de reports para notificação urgente ao moderador */
  REPORTS_THRESHOLD_URGENT: 5,

  /** Mínimo de caracteres na descrição */
  DESCRIPTION_MIN_LENGTH: 20,

  /** Máximo de caracteres na descrição */
  DESCRIPTION_MAX_LENGTH: 280,

  /** Idade mínima da conta em dias para criar alertas */
  MIN_ACCOUNT_AGE_DAYS: 7,

  /** Máximo de tentativas de processamento na fila de notificações */
  NOTIFICATION_MAX_ATTEMPTS: 5,

  /** Timeout de lock do worker de notificações em minutos */
  NOTIFICATION_LOCK_TIMEOUT_MINUTES: 5,
} as const;

// ============================================================================
// TERMOS PROIBIDOS (validação frontend — UX imediato)
// A validação definitiva é server-side via alert_blocked_terms
// ============================================================================

export const ALERT_BLOCKED_TERMS_FRONTEND = [
  "blitz",
  "viatura",
  "fiscalização",
  "lei seca",
  "operação",
  "guarnição",
  "abordagem",
  "perseguição",
  "rota policial",
  "polícia",
  "bope",
  "caveira",
  "pm ",
  " pm",
  "drone policial",
  "agente público",
  "suspeito chamado",
  "mora em",
  "trabalha em",
  "favelado",
];

// ============================================================================
// TEXTO DO MODAL (neutro, profissional)
// ============================================================================

export const ALERT_MODAL_DISCLAIMER = `Use este recurso apenas para riscos reais, atuais e relevantes à comunidade.

Não use para monitorar operações, fiscalizações, perseguições ou movimentações operacionais.

Descreva apenas fatos observáveis, sem acusações, suposições ou identificação de pessoas.

Conteúdos podem ser revisados e removidos pela moderação. Uso indevido pode levar à suspensão do recurso, e alertas falsos ou maliciosos podem gerar bloqueio imediato.`;

export const ALERT_CONFIRMATION_CHECKBOXES = [
  {
    id: "confirm_real",
    label: "Confirmo que este alerta descreve risco real e imediato à comunidade.",
  },
  {
    id: "confirm_no_ops",
    label:
      "Entendo que não posso usar este recurso para monitorar operações, fiscalizações ou acusar pessoas.",
  },
  {
    id: "confirm_consequences",
    label:
      "Alertas falsos podem gerar bloqueio do recurso.",
  },
] as const;
