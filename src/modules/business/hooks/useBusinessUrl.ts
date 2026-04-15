/**
 * Hook for obter URL de business
 * @deprecated Use BusinessUrlService.getCanonicalUrl() diretamente.
 * Este hook não tem acesso ao geographic_path e retorna URL legada /business/:slug.
 * Substituir pelos consumidores quando geographic_path estiver disponível.
 */

import { useMemo } from "react";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

interface BusinessUrlData {
  id?: string;
  slug: string;
  is_premium?: boolean;
  geographic_path?: string | null;
}

export function useBusinessUrl(business: BusinessUrlData | null) {
  const url = useMemo(() => {
    if (!business?.slug) return null;
    return BusinessUrlService.getCanonicalUrl({
      id: business.id ?? '',
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path ?? null,
    });
  }, [business]);

  const canonicalUrl = url;

  return { url, canonicalUrl };
}
