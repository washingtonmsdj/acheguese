import type {
  TrustEvent,
  TrustEventStatus,
  TrustPolicyDecision,
} from "@/core/trust";

export type TrustContextFilter = "all" | TrustEvent["context_type"];

export const CONTEXT_LABELS: Record<TrustContextFilter, string> = {
  all: "Todos",
  order: "Pedidos",
  ride: "Corridas",
  delivery: "Entregas",
  classified: "Classificados",
  service: "Servicos",
  community: "Comunidade",
};

export const SEVERITY_LABELS: Record<TrustEvent["severity"], string> = {
  low: "Baixa",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

export const STATUS_LABELS: Record<TrustEventStatus, string> = {
  active: "Ativo",
  under_review: "Em analise",
  dismissed: "Descartado",
  confirmed: "Confirmado",
  penalized: "Penalizado",
};

export const RISK_LABELS: Record<TrustPolicyDecision["risk_level"], string> = {
  trusted: "Confiavel",
  watchlist: "Observacao",
  restricted: "Restrito",
  critical: "Critico",
};

export const ACTION_LABELS: Record<TrustPolicyDecision["recommended_action"], string> = {
  none: "Sem acao",
  monitor: "Monitorar",
  warn: "Avisar",
  manual_review: "Revisao manual",
  temporary_restriction: "Restricao temporaria",
};

export function getSeverityVariant(severity: TrustEvent["severity"]) {
  return severity === "critical" || severity === "high" ? "destructive" : "outline";
}

export function getRiskVariant(risk: TrustPolicyDecision["risk_level"]) {
  if (risk === "critical" || risk === "restricted") return "destructive";
  if (risk === "watchlist") return "secondary";
  return "outline";
}

export function renderProfileShortId(id: string) {
  return id.slice(0, 8);
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
