import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import type { Professional, ProfessionalStats } from "@/core/professional/types";

export function formatProfessionalCategory(value: string | undefined) {
  if (!value) return "Servico";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatProfessionalOperationalHours(
  availableHours: Professional["available_hours"],
): string {
  if (!availableHours || typeof availableHours !== "object") {
    return "Nao informado";
  }

  const entries = Object.entries(availableHours as Record<string, unknown>)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .slice(0, 3)
    .map(([day, value]) => `${day}: ${value as string}`);

  return entries.length ? entries.join(" | ") : "Nao informado";
}

export function resolveProfessionalPublicUrl(service: Professional): string {
  if (service.slug && service.state && service.city) {
    return ProfessionalUrlService.getCanonicalUrl({
      id: service.profile_id,
      slug: service.slug,
      state: service.state,
      city: service.city,
    });
  }

  return `/servicos/${service.id}`;
}

export function getProfessionalStatsValue(
  stats: ProfessionalStats | undefined,
  snakeKey: "total_views" | "total_contacts",
  camelKey: "totalViews" | "totalContacts",
): number {
  const record = stats as unknown as Record<string, unknown> | undefined;
  const value = record?.[snakeKey] ?? record?.[camelKey] ?? 0;
  return typeof value === "number" ? value : Number(value) || 0;
}

export function getAverageProfessionalRating(services: Professional[]): number {
  if (!services.length) return 0;

  const total = services.reduce(
    (sum, service) => sum + (Number(service.rating) || 0),
    0,
  );

  return total / services.length;
}
