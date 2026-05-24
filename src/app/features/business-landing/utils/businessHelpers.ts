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
  fallbackUrl: string
): string {
  if (business.slug && business.geographic_path) {
    return BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium || false,
      geographic_path: business.geographic_path,
    });
  }

  return fallbackUrl;
}
