/**
 * Hook para buscar profissional por slug + uf + cidade
 * Usado pela pagina publica /servicos/:state/:city/profissional/:slug
 *
 * ✅ BLINDAGEM v3.0: Acesso ao banco delegado para ProfessionalService
 */

import { useQuery } from '@tanstack/react-query';
import { ProfessionalService } from '@/core/professional/services';

export interface ProfessionalPublicProfile {
  id: string;
  slug: string;
  professional_name: string;
  description: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  is_verified: boolean;
  is_accepting_clients: boolean;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  certifications: string[] | null;
  experience_years: number | null;
  price_range: string | null;
}

interface UseProfessionalBySlugParams {
  uf: string;
  cidade: string;
  slug: string;
  enabled?: boolean;
}

export function useProfessionalBySlug({
  uf,
  cidade,
  slug,
  enabled = true,
}: UseProfessionalBySlugParams) {
  return useQuery({
    queryKey: ['professional-public', uf, cidade, slug],
    queryFn: async (): Promise<ProfessionalPublicProfile | null> =>
      ProfessionalService.getPublicProfileBySlug(slug, uf, cidade),
    enabled: enabled && !!uf && !!cidade && !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
