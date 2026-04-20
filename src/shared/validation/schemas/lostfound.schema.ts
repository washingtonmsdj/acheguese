/**
 * LOST & FOUND VALIDATION SCHEMAS - Validação Centralizada SSOT
 *
 * Schema para formulários de achados e perdidos.
 */

import { z } from "zod";

export const CATEGORIAS_LOSTFOUND = [
  "animal",
  "celular",
  "documentos",
  "chaves",
  "carteira",
  "objetos",
  "outro",
] as const;

export const NovoAchadoPerdidoSchema = z.object({
  tipo: z.enum(["perdido", "encontrado"], {
    required_error: "Selecione se perdeu ou encontrou algo",
  }),
  category: z.enum(CATEGORIAS_LOSTFOUND, {
    required_error: "Selecione uma categoria",
  }),
  titulo: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(150, "Título deve ter no máximo 150 caracteres")
    .trim(),
  description: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .trim()
    .optional(),
  neighborhood: z.string().trim().optional(),
  localizacaoAprox: z.string().trim().optional(),
  dateOcorrido: z.date({
    required_error: "Data do ocorrido é obrigatória",
  }),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type NovoAchadoPerdidoInput = z.infer<typeof NovoAchadoPerdidoSchema>;
