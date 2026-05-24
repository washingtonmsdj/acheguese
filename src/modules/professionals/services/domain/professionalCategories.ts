import {
  BarChart3,
  BrickWall,
  Building2,
  Calculator,
  Camera,
  CircleEllipsis,
  GraduationCap,
  KeyRound,
  Laptop,
  Leaf,
  Paintbrush,
  Palette,
  Scale,
  Scissors,
  Search,
  Smartphone,
  Sparkles,
  Stethoscope,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProfessionalCategory } from "@/core/professional/types";

export type ServiceCategoryFilterId = "todos" | ProfessionalCategory;

export interface ServiceCategoryOption {
  id: ServiceCategoryFilterId;
  name: string;
  icon: LucideIcon;
}

export const SERVICE_CATEGORY_OPTIONS = [
  { id: "todos", name: "Todos", icon: Search },
  { id: "eletricista", name: "Eletricista", icon: Zap },
  { id: "encanador", name: "Encanador", icon: Wrench },
  { id: "pedreiro", name: "Pedreiro", icon: BrickWall },
  { id: "pintor", name: "Pintor", icon: Paintbrush },
  { id: "diarista", name: "Diarista", icon: Sparkles },
  { id: "tecnico_celular", name: "Técnico", icon: Smartphone },
  { id: "mecanico", name: "Mecânico", icon: Wrench },
  { id: "chaveiro", name: "Chaveiro", icon: KeyRound },
  { id: "jardineiro", name: "Jardineiro", icon: Leaf },
  { id: "saude", name: "Saúde", icon: Stethoscope },
  { id: "beleza", name: "Beleza", icon: Scissors },
  { id: "educacao", name: "Educação", icon: GraduationCap },
  { id: "tecnologia", name: "Tecnologia", icon: Laptop },
  { id: "construcao", name: "Construção", icon: Building2 },
  { id: "consultoria", name: "Consultoria", icon: BarChart3 },
  { id: "design", name: "Design", icon: Palette },
  { id: "fotografia", name: "Fotografia", icon: Camera },
  { id: "juridico", name: "Jurídico", icon: Scale },
  { id: "contabilidade", name: "Contabilidade", icon: Calculator },
  { id: "outros", name: "Outros", icon: CircleEllipsis },
] as const satisfies readonly ServiceCategoryOption[];

export const SERVICE_FORM_CATEGORY_OPTIONS = SERVICE_CATEGORY_OPTIONS.filter(
  (category): category is Extract<(typeof SERVICE_CATEGORY_OPTIONS)[number], { id: ProfessionalCategory }> =>
    category.id !== "todos",
);

export function getServiceCategoryIcon(categoryId: string | null | undefined): LucideIcon {
  return SERVICE_CATEGORY_OPTIONS.find((category) => category.id === categoryId)?.icon ?? Wrench;
}

export function getServiceCategoryLabel(categoryId: string | null | undefined): string {
  return SERVICE_CATEGORY_OPTIONS.find((category) => category.id === categoryId)?.name ?? categoryId ?? "";
}
