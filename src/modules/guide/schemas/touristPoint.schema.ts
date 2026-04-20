/**
 * TOURIST POINT VALIDATION SCHEMAS
 *
 * Schema para formulário de criação/edição de pontos turísticos.
 */

import { z } from "zod";
import {
  PRICE_TYPE,
  TOURIST_POINT_STATUS,
} from "../types";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export const TouristPointFormSchema = z.object({
  location_id: z.string().uuid("ID da localização inválido"),
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug deve ter no mínimo 3 caracteres")
    .max(100, "Slug deve ter no máximo 100 caracteres")
    .trim()
    .optional(),
  summary: z
    .string()
    .min(3, "Resumo deve ter no mínimo 3 caracteres")
    .max(200, "Resumo deve ter no máximo 200 caracteres")
    .trim(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim(),
  address_text: z.preprocess(
    emptyStringToNull,
    z.string().max(300, "Endereço deve ter no máximo 300 caracteres").trim().nullable()
  ),
  price_type: z.enum([PRICE_TYPE.FREE, PRICE_TYPE.PAID, PRICE_TYPE.RANGE, PRICE_TYPE.CONSULT], {
    required_error: "Selecione o tipo de preço",
  }),
  price_text: z.preprocess(
    emptyStringToNull,
    z.string().max(100, "Detalhe do preço deve ter no máximo 100 caracteres").trim().nullable()
  ),
  opening_hours: z.preprocess(
    emptyStringToNull,
    z.string().max(200, "Horário deve ter no máximo 200 caracteres").trim().nullable()
  ),
  accessibility_notes: z.preprocess(
    emptyStringToNull,
    z.string().max(500, "Notas de acessibilidade devem ter no máximo 500 caracteres").trim().nullable()
  ),
  official_url: z.preprocess(
    emptyStringToNull,
    z.string().url("URL inválida").max(500, "URL deve ter no máximo 500 caracteres").nullable()
  ),
  is_featured: z.boolean().default(false),
  status: z.enum([TOURIST_POINT_STATUS.DRAFT, TOURIST_POINT_STATUS.PUBLISHED, TOURIST_POINT_STATUS.ARCHIVED], {
    required_error: "Selecione o status",
  }),
});

export type TouristPointFormInput = z.infer<typeof TouristPointFormSchema>;
