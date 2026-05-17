import type { WorkOpportunityType, WorkOpportunityUrgency } from "../types";

export interface OpportunityPayloadCard {
  id?: string;
  type?: WorkOpportunityType;
  headline?: string;
  description?: string;
  professional_id?: string | null;
  professional_category?: string;
  territory_location_id?: string;
  territory_name?: string;
  urgency?: WorkOpportunityUrgency;
  availability_notes?: string | null;
  compensation_notes?: string | null;
  contact_notes?: string | null;
  visibility?: string;
  status?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function extractOpportunityPayload(contentPayload: unknown): OpportunityPayloadCard | null {
  const root = asRecord(contentPayload);
  if (!root) return null;

  const directOpportunity = asRecord(root.opportunity);
  if (directOpportunity) {
    return directOpportunity as OpportunityPayloadCard;
  }

  const structuralOpportunity = asRecord(root.structural)
    ? asRecord((root.structural as Record<string, unknown>).opportunity)
    : null;

  if (structuralOpportunity) {
    return structuralOpportunity as OpportunityPayloadCard;
  }

  if (typeof root.headline === "string" && typeof root.professional_category === "string") {
    return root as OpportunityPayloadCard;
  }

  return null;
}

export function getOpportunityTypeLabel(type?: WorkOpportunityType): string {
  switch (type) {
    case "looking_for_work":
      return "Procuro trabalho";
    case "offering_work":
      return "Ofereço trabalho";
    case "freelance":
      return "Freela";
    case "quick_job":
      return "Diária rápida";
    case "service_availability":
      return "Disponível para serviços";
    default:
      return "Oportunidade";
  }
}

export function getOpportunityUrgencyLabel(urgency?: WorkOpportunityUrgency): string {
  switch (urgency) {
    case "hoje":
      return "Hoje";
    case "24h":
      return "Próximas 24h";
    case "semana":
      return "Esta semana";
    case "flexivel":
      return "Flexível";
    default:
      return "Sem urgência definida";
  }
}

export function getOpportunityTypeEmoji(type?: WorkOpportunityType): string {
  switch (type) {
    case "looking_for_work":
      return "??";
    case "offering_work":
      return "??";
    case "freelance":
      return "?";
    case "quick_job":
      return "???";
    case "service_availability":
      return "??";
    default:
      return "??";
  }
}
