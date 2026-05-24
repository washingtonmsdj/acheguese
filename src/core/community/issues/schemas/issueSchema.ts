/**
 * Community Issues - Schemas de validacao Zod
 */

import { z } from "zod";
import { ISSUE_RULES } from "../config/issueConfig";

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

export const createIssueSchema = z.object({
  location_id: z.string().uuid("Localizacao invalida."),

  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: "Selecione uma categoria valida." }),
  }),

  title: z
    .string()
    .min(ISSUE_RULES.TITLE_MIN_LENGTH, `Título deve ter pelo menos ${ISSUE_RULES.TITLE_MIN_LENGTH} caracteres.`)
    .max(ISSUE_RULES.TITLE_MAX_LENGTH, `Título deve ter no máximo ${ISSUE_RULES.TITLE_MAX_LENGTH} caracteres.`),

  description: z
    .string()
    .min(
      ISSUE_RULES.DESCRIPTION_MIN_LENGTH,
      `Descrição deve ter pelo menos ${ISSUE_RULES.DESCRIPTION_MIN_LENGTH} caracteres.`
    )
    .max(
      ISSUE_RULES.DESCRIPTION_MAX_LENGTH,
      `Descrição deve ter no máximo ${ISSUE_RULES.DESCRIPTION_MAX_LENGTH} caracteres.`
    ),

  address_reference: z.string().max(150, "Referência muito longa.").optional(),

  priority: z.enum(VALID_PRIORITIES).optional(),
});

export type CreateIssueFormData = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z.object({
  title: z.string().min(ISSUE_RULES.TITLE_MIN_LENGTH).max(ISSUE_RULES.TITLE_MAX_LENGTH).optional(),
  description: z
    .string()
    .min(ISSUE_RULES.DESCRIPTION_MIN_LENGTH)
    .max(ISSUE_RULES.DESCRIPTION_MAX_LENGTH)
    .optional(),
  address_reference: z.string().max(150).optional(),
});

export type UpdateIssueFormData = z.infer<typeof updateIssueSchema>;

export const createIssueReportSchema = z.object({
  issue_id: z.string().uuid("ID de problema invalido."),
  reason: z.enum(VALID_REPORT_REASONS, {
    errorMap: () => ({ message: "Selecione um motivo." }),
  }),
});

export type CreateIssueReportFormData = z.infer<typeof createIssueReportSchema>;
