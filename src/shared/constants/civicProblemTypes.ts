/**
 * Configurações de tipos de problemas cívicos (zeladoria)
 *
 * @module civicProblemTypes
 */

import {
  Construction,
  AlertTriangle,
  Lightbulb,
  Trash2,
  TreePine,
  Droplets,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
export type CivicProblemType =
  | "buraco"
  | "iluminacao"
  | "lixo"
  | "arvore"
  | "esgoto"
  | "calcada"
  | "outro";

export interface CivicProblemConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export const CIVIC_PROBLEM_TYPES: Record<CivicProblemType, CivicProblemConfig> =
  {
    buraco: {
      label: "Buraco na Rua",
      icon: AlertTriangle,
      color: "#EF4444",
    },
    iluminacao: {
      label: "Iluminação Pública",
      icon: Lightbulb,
      color: "#F59E0B",
    },
    lixo: {
      label: "Acúmulo de Lixo",
      icon: Trash2,
      color: "#10B981",
    },
    arvore: {
      label: "Poda de Árvore",
      icon: TreePine,
      color: "#059669",
    },
    esgoto: {
      label: "Esgoto/Vazamento",
      icon: Droplets,
      color: "#3B82F6",
    },
    calcada: {
      label: "Calçada Danificada",
      icon: Construction,
      color: "#F97316",
    },
    outro: {
      label: "Outro",
      icon: AlertCircle,
      color: "#6B7280",
    },
  } as const;
