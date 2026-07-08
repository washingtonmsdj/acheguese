/**
 * Business Helpers
 * 
 * Funções utilitárias para manipulação de dados de empresas
 */

import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { Business } from "../sections/types";

/**
 * Gera URL canônica para uma empresa
 */
export function getBusinessUrl(
  business: Business,
  fallbackUrl: string,
  canonicalUrl?: (ctx: {
    id: string;
    slug: string;
    is_premium?: boolean;
    geographic_path: string;
  }) => string,
): string {
  if (business.slug && business.geographic_path) {
    const ctx = {
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium || false,
      geographic_path: business.geographic_path,
    };

    return canonicalUrl ? canonicalUrl(ctx) : BusinessUrlService.getCanonicalUrl(ctx);
  }

  return fallbackUrl;
}

export function applyBusinessFilterSet(
  businesses: readonly Business[],
  activeFilters: readonly string[],
): Business[] {
  return businesses.filter((business) => {
    if (activeFilters.includes("open_now") && !business.isOpen) return false;
    if (activeFilters.includes("verified") && !business.is_verified) return false;
    if (activeFilters.includes("recommended") && business.neighborRecs <= 0) return false;
    if (activeFilters.includes("whatsapp") && !business.whatsapp) return false;
    if (
      activeFilters.includes("delivery") &&
      !(business.modos_atendimento ?? []).some(
        (value) =>
          value.toLowerCase().includes("delivery") ||
          value.toLowerCase().includes("domic"),
      )
    ) {
      return false;
    }

    return true;
  });
}
