/**
 * Hook para buscar profissional por slug + uf + cidade
 * Usado pela página pública /profissionais/:uf/:cidade/:slug
 *
 * ✅ BLINDAGEM v3.0: Acesso ao banco delegado para ProfessionalService
 */

import { useQuery } from '@tanstack/react-query';
import { ProfessionalFacade } from '@/core/professional/services';

export type ProfessionalPublicProfile = Awaited<
  ReturnType<typeof ProfessionalFacade.queries.getPublicProfileBySlug>
>;

interface UseProfessionalBySlugParams {
  uf: string;
  cidade: string;
  slug: string;
}

export function useProfessionalBySlug({ uf, cidade, slug }: UseProfessionalBySlugParams) {
  return useQuery({
    queryKey: ['professional-public', uf, cidade, slug],
    queryFn: () => ProfessionalFacade.queries.getPublicProfileBySlug(slug, uf, cidade),
    enabled: !!uf && !!cidade && !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
