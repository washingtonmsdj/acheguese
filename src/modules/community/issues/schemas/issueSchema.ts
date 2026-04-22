/**
 * Community Issues — Schemas de validação Zod
 * Validação frontend (UX imediato). Validação definitiva é server-side via RPC.
 */

import { z } from "zod";
import { ISSUE_RULES } from "../config/issueConfig";

// ============================================================================
// HELPERS
// ============================================================================

const VALID_CATEGORIES = [
  "buraco_via",
  "calcada_danificada",
  "iluminacao_publica",
  "lixo_acumulado",
  "alagamento_cronico",
  "arvore_risco",
  "sinalizacao_danificada",
  "esgoto_aberto",
  "pichacao_vandalismo",
  "outro",
] as const;

const VALID_PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;

const VALID_REPORT_REASONS = [
  "duplicate",
  "false_report",
  "inappropriate_content",
  "spam",
  "other",
] as const;

// ============================================================================
// SCHEMA DE CRIAÇÃO
// ============================================================================

export const createIssueSchema = z.object({
  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: "Selecione uma categoria válida." }),
  }),

  title: z
    .string()
    .min(ISSUE_RULES.TITLE_MIN_LENGTH, `Título deve ter pelo menos ${ISSUE_RULES.TITLE_MIN_LENGTH} caracteres.`)
    .max(ISSUE_RULES.TITLE_MAX_LENGTH, `Título deve ter no máximo ${ISSUE_RULES.TITLE_MAX_LENGTH} caracteres.`),

  description: z
    .string()
    .min(ISSUE_RULES.DESCRIPTION_MIN_LENGTH, `Descrição deve ter pelo menos ${ISSUE_RULES.DESCRIPTION_MIN_LENGTH} caracteres.`)
    .max(ISSUE_RULES.DESCRIPTION_MAX_LENGTH, `Descrição deve ter no máximo ${ISSUE_RULES.DESCRIPTION_MAX_LENGTH} caracteres.`),

  neighborhood: z
    .string()
    .min(2, "Bairro inválido.")
    .max(100),

  city: z
    .string()
    .min(2, "Cidade inválida.")
    .max(100),

  address_reference: z
    .string()
    .max(150, "Referência muito longa.")
    .optional(),

  priority: z.enum(VALID_PRIORITIES).optional(),
});

export type CreateIssueFormData = z.infer<typeof createIssueSchema>;

// ============================================================================
// SCHEMA DE ATUALIZAÇÃO
// ============================================================================

export const updateIssueSchema = z.object({
  title: z
    .string()
    .min(ISSUE_RULES.TITLE_MIN_LENGTH)
    .max(ISSUE_RULES.TITLE_MAX_LENGTH)
    .optional(),

  description: z
    .string()
    .min(ISSUE_RULES.DESCRIPTION_MIN_LENGTH)
    .max(ISSUE_RULES.DESCRIPTION_MAX_LENGTH)
    .optional(),

  address_reference: z
    .string()
    .max(150)
    .optional(),
});

export type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;

// ============================================================================
// SCHEMA DE REPORT
// ============================================================================

export const createIssueReportSchema = z.object({
  issue_id: z.string().uuid("ID de problema inválido."),
  reason: z.enum(VALID_REPORT_REASONS, {
    errorMap: () => ({ message: "Selecione um motivo." }),
  }),
});

export type CreateIssueReportFormData = z.infer<typeof createIssueReportSchema>;
