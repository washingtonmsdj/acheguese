import {
  Briefcase,
  Tag,
  DollarSign,
  MapPin,
  Phone,
  Eye,
} from "lucide-react";
import {
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  type VagaContrato,
  type VagaModalidade,
  type VagaNivel,
  type VagaSalaryMode,
} from "../types/vagas.types";

export const STEPS = [
  { id: "info", label: "Informações", icon: Briefcase, number: 1 },
  { id: "details", label: "Detalhes", icon: Tag, number: 2 },
  { id: "salary", label: "Salário", icon: DollarSign, number: 3 },
  { id: "location", label: "Localização", icon: MapPin, number: 4 },
  { id: "contact", label: "Contato", icon: Phone, number: 5 },
  { id: "preview", label: "Revisão", icon: Eye, number: 6 },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const contratoLabelsMap = new Map(
  Object.entries(CONTRATO_LABELS) as Array<[VagaContrato, string]>,
);

export const modalidadeLabelsMap = new Map(
  Object.entries(MODALIDADE_LABELS) as Array<[VagaModalidade, string]>,
);

export const nivelLabelsMap = new Map(
  Object.entries(NIVEL_LABELS) as Array<[VagaNivel, string]>,
);

export const SUGGESTED_BENEFITS = [
  "Vale Refeição",
  "Vale Transporte",
  "Plano de Saúde",
  "Plano Odontológico",
  "Seguro de Vida",
  "Gympass",
  "Day Off Aniversário",
  "PLR",
  "Home Office",
  "Horário Flexível",
  "Estacionamento",
  "Auxílio Creche",
];

export function buildVagasListPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (
    parts[0] === "comunidade" &&
    parts[1] &&
    parts[2] &&
    parts[3] &&
    parts[4] === "vagas" &&
    parts[5] === "publicar"
  ) {
    return `/comunidade/${parts[1]}/${parts[2]}/${parts[3]}/vagas`;
  }
  return "/vagas";
}

export function addUniqueListItem(list: string[], input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed || list.includes(trimmed)) return list;
  return [...list, trimmed];
}

export function removeListItem(list: string[], index: number): string[] {
  return list.filter((_, i) => i !== index);
}

export function toggleListItem(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

export function parseSalaryInputToCents(value: string): number | undefined {
  const sanitized = value.trim();
  if (!sanitized) return undefined;
  const numeric = Number(sanitized.replace(",", "."));
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return Math.round(numeric * 100);
}

export function resolveSalaryMode(
  ocultarSalario: boolean,
  minValueInCents: number | undefined,
  maxValueInCents: number | undefined,
): {
  mode: VagaSalaryMode;
  min?: number;
  max?: number;
  text?: string;
} {
  if (ocultarSalario) {
    return {
      mode: "a_combinar",
      text: "A combinar",
    };
  }

  if (minValueInCents && maxValueInCents) {
    return {
      mode: "range",
      min: Math.min(minValueInCents, maxValueInCents),
      max: Math.max(minValueInCents, maxValueInCents),
    };
  }

  if (minValueInCents || maxValueInCents) {
    const fixedValue = minValueInCents ?? maxValueInCents;
    return {
      mode: "fixed",
      min: fixedValue,
      max: fixedValue,
    };
  }

  return {
    mode: "a_combinar",
    text: "A combinar",
  };
}
