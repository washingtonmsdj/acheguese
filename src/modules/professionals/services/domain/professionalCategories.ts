import type { ProfessionalCategory } from "@/core/professional/types";

export type ServiceCategoryFilterId = "todos" | ProfessionalCategory;

export interface ServiceCategoryOption {
  id: ServiceCategoryFilterId;
  name: string;
  icone: string;
}

export const SERVICE_CATEGORY_OPTIONS = [
  { id: "todos", name: "Todos", icone: "🔍" },
  { id: "eletricista", name: "Eletricista", icone: "⚡" },
  { id: "encanador", name: "Encanador", icone: "🔧" },
  { id: "pedreiro", name: "Pedreiro", icone: "🧱" },
  { id: "pintor", name: "Pintor", icone: "🎨" },
  { id: "diarista", name: "Diarista", icone: "🧹" },
  { id: "tecnico_celular", name: "Técnico", icone: "📱" },
  { id: "mecanico", name: "Mecânico", icone: "🔩" },
  { id: "chaveiro", name: "Chaveiro", icone: "🔑" },
  { id: "jardineiro", name: "Jardineiro", icone: "🌱" },
  { id: "saude", name: "Saúde", icone: "🏥" },
  { id: "beleza", name: "Beleza", icone: "💇" },
  { id: "educacao", name: "Educação", icone: "📚" },
  { id: "tecnologia", name: "Tecnologia", icone: "💻" },
  { id: "construcao", name: "Construção", icone: "🏗️" },
  { id: "consultoria", name: "Consultoria", icone: "📊" },
  { id: "design", name: "Design", icone: "🎯" },
  { id: "fotografia", name: "Fotografia", icone: "📷" },
  { id: "juridico", name: "Jurídico", icone: "⚖️" },
  { id: "contabilidade", name: "Contabilidade", icone: "🧮" },
  { id: "outros", name: "Outros", icone: "🛠️" },
] as const satisfies readonly ServiceCategoryOption[];

export const SERVICE_FORM_CATEGORY_OPTIONS = SERVICE_CATEGORY_OPTIONS.filter(
  (category): category is Extract<(typeof SERVICE_CATEGORY_OPTIONS)[number], { id: ProfessionalCategory }> =>
    category.id !== "todos",
);

export function getServiceCategoryIcon(categoryId: string | null | undefined): string {
  return SERVICE_CATEGORY_OPTIONS.find((category) => category.id === categoryId)?.icone ?? "🔧";
}

export function getServiceCategoryLabel(categoryId: string | null | undefined): string {
  return SERVICE_CATEGORY_OPTIONS.find((category) => category.id === categoryId)?.name ?? categoryId ?? "";
}
