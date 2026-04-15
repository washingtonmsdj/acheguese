import { RIDE_STATUS, ALERT_STATUS } from "@/shared/types/constants";
/**
 * Configurações de status e urgência para posts de zeladoria/cívicos
 *
 * @module statusConfig
 *
 * @note CORRIGIDO: Renomeado de PostStatus para CivicPostStatus
 * para evitar conflito com PostStatus em global.constants.ts
 */

// Status para posts de zeladoria/cívicos
export type CivicPostStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";
export type PostStatus = CivicPostStatus;
export type PostUrgency = "low" | "medium" | "high" | "critical";

export interface StatusConfig {
  label: string;
  color: string;
}

export const STATUS_CONFIG: Record<CivicPostStatus, StatusConfig> = {
  pending: {
    label: "Pendente",
    color: "#F59E0B",
  },
  in_progress: {
    label: "Em Andamento",
    color: "#3B82F6",
  },
  resolved: {
    label: "Resolvido",
    color: "#10B981",
  },
  rejected: {
    label: "Rejeitado",
    color: "#EF4444",
  },
} as const;

export const URGENCY_CONFIG: Record<PostUrgency, StatusConfig> = {
  low: {
    label: "Baixa",
    color: "#6B7280",
  },
  medium: {
    label: "Média",
    color: "#F59E0B",
  },
  high: {
    label: "Alta",
    color: "#F97316",
  },
  critical: {
    label: "Crítica",
    color: "#EF4444",
  },
} as const;
