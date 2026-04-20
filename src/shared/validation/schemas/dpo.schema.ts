/**
 * DPO (Data Protection Officer) VALIDATION SCHEMAS
 *
 * Schema para formulário de contato do Encarregado de Dados.
 */

import { z } from "zod";

export const DPO_REQUEST_TYPES = [
  "access",
  "correction",
  "anonymization",
  "portability",
  "deletion",
  "information",
  "consent_revocation",
  "automated_decision",
  "violation_report",
  "other",
] as const;

export const DPOContactSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  email: z
    .string()
    .email("E-mail inválido")
    .min(1, "E-mail é obrigatório")
    .trim(),
  requestType: z.enum(DPO_REQUEST_TYPES, {
    required_error: "Selecione o tipo de solicitação",
  }),
  subject: z
    .string()
    .min(3, "Assunto deve ter no mínimo 3 caracteres")
    .max(200, "Assunto deve ter no máximo 200 caracteres")
    .trim(),
  message: z
    .string()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(5000, "Mensagem deve ter no máximo 5000 caracteres")
    .trim(),
});

export type DPOContactInput = z.infer<typeof DPOContactSchema>;
