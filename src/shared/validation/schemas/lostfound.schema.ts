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

export type LostFoundCategory = (typeof CATEGORIAS_LOSTFOUND)[number];

export const LOST_FOUND_CATEGORY_DETAILS: Record<
  LostFoundCategory,
  { label: string; createLabel: string }
> = {
  animal: { label: "Animal", createLabel: "Animal perdido ou encontrado" },
  celular: { label: "Celular", createLabel: "Celular" },
  documentos: { label: "Documentos", createLabel: "Documentos" },
  chaves: { label: "Chaves", createLabel: "Chaves" },
  carteira: { label: "Carteira", createLabel: "Carteira" },
  objetos: { label: "Objetos", createLabel: "Objetos diversos" },
  outro: { label: "Outro", createLabel: "Outro item" },
};

export const LOST_FOUND_CATEGORY_OPTIONS = CATEGORIAS_LOSTFOUND.map((id) => ({
  id,
  ...LOST_FOUND_CATEGORY_DETAILS[id],
}));

export const LOST_FOUND_FILTER_OPTIONS = [
  { id: "todos" as const, label: "Todos" },
  ...LOST_FOUND_CATEGORY_OPTIONS.map(({ id, label }) => ({ id, label })),
];

export function getLostFoundCategoryLabel(category: string): string {
  return LOST_FOUND_CATEGORY_DETAILS[category as LostFoundCategory]?.label ?? "Outro";
}

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
  location_id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().uuid("Selecione um território válido").optional(),
  ),
  localizacaoAprox: z.string().trim().optional(),
  dateOcorrido: z.date({
    required_error: "Data do ocorrido é obrigatória",
  }),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type NovoAchadoPerdidoInput = z.infer<typeof NovoAchadoPerdidoSchema>;
