/**
 * Community Alerts - Schemas de validação Zod
 */

import { z } from "zod";
import { ALERT_RULES, ALERT_BLOCKED_TERMS_FRONTEND } from "../config/alertConfig";

const VALID_CATEGORIES = [
  "tiroteio_disparos",
  "assalto_em_andamento",
  "tentativa_de_invasao",
  "incendio_explosao",
  "acidente_grave",
  "alagamento_deslizamento",
  "risco_na_via",
  "pessoa_vulneravel_em_risco",
] as const;

const VALID_STARTED_APPROX = [
  "just_now",
  "minutes_5",
  "minutes_15",
  "minutes_30",
  "over_30",
] as const;

const VALID_REPORT_REASONS = [
  "false_alert",
  "promotes_crime",
  "identifies_person",
  "monitors_operation",
  "hate_speech",
  "spam",
  "other",
] as const;

function containsBlockedTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return ALERT_BLOCKED_TERMS_FRONTEND.some((term) => lower.includes(term.toLowerCase()));
}

export const createAlertSchema = z
  .object({
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: "Selecione uma categoria válida." }),
    }),

    location_id: z.string().uuid("Localização inválida."),

    location_reference: z
      .string()
      .max(120, "Referência muito longa.")
      .optional()
      .refine((val) => !val || !containsBlockedTerm(val), "A referência contém conteúdo não permitido."),

    description: z
      .string()
      .min(
        ALERT_RULES.DESCRIPTION_MIN_LENGTH,
        `Descrição deve ter pelo menos ${ALERT_RULES.DESCRIPTION_MIN_LENGTH} caracteres.`
      )
      .max(
        ALERT_RULES.DESCRIPTION_MAX_LENGTH,
        `Descrição deve ter no máximo ${ALERT_RULES.DESCRIPTION_MAX_LENGTH} caracteres.`
      )
      .refine((val) => !containsBlockedTerm(val), "A descrição contém conteúdo não permitido neste recurso."),

    seen_personally: z.boolean(),

    started_at_approx: z.enum(VALID_STARTED_APPROX, {
      errorMap: () => ({ message: "Selecione quando o evento começou." }),
    }),

    is_happening_now: z.boolean(),
    still_risky: z.boolean(),

    confirm_real: z.literal(true, {
      errorMap: () => ({ message: "Confirmação obrigatória." }),
    }),
    confirm_no_ops: z.literal(true, {
      errorMap: () => ({ message: "Confirmação obrigatória." }),
    }),
    confirm_consequences: z.literal(true, {
      errorMap: () => ({ message: "Confirmação obrigatória." }),
    }),
  })
  .refine((data) => !(data.is_happening_now === true && data.still_risky === false), {
    message: "Se o evento está acontecendo agora, ele ainda representa risco.",
    path: ["still_risky"],
  })
  .refine(
    (data) => !(data.seen_personally === false && data.is_happening_now === false && data.still_risky === false),
    {
      message: "Alerta sem valor informativo. Revise as respostas.",
      path: ["still_risky"],
    }
  );

export type CreateAlertFormData = z.infer<typeof createAlertSchema>;

export const updateAlertSchema = z.object({
  description: z
    .string()
    .min(ALERT_RULES.DESCRIPTION_MIN_LENGTH)
    .max(ALERT_RULES.DESCRIPTION_MAX_LENGTH)
    .refine((val) => !containsBlockedTerm(val), "Conteúdo não permitido.")
    .optional(),
  still_risky: z.boolean().optional(),
});

export type UpdateAlertFormData = z.infer<typeof updateAlertSchema>;

export const createAlertReportSchema = z.object({
  alert_id: z.string().uuid("ID de alerta inválido."),
  reason: z.enum(VALID_REPORT_REASONS, {
    errorMap: () => ({ message: "Selecione um motivo." }),
  }),
});

export type CreateAlertReportFormData = z.infer<typeof createAlertReportSchema>;
