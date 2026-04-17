/**
 * useUserTerritory
 *
 * Retorna o bairro e cidade "casa" do usuário resolvidos pelo UUID canônico
 * da tabela locations — nunca por string matching.
 *
 * Fonte de verdade: user_residences.location_id (FK → locations.id)
 * Isso garante que renomear ou mover um bairro no banco não afeta nenhum usuário.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { createLocationRepository } from '../repositories/createLocationRepository';
import { residenceService } from '@/core/residence/services/ResidenceService';

export interface UserTerritory {
  /** Bairro do usuário (district) */
  homeDistrict: { id: string; name: string; path: string } | null;
  /** Cidade do usuário (city) */
  homeCity: { id: string; name: string; path: string } | null;
  /** Se o usuário tem bairro definido */
  hasHome: boolean;
  /** Se está carregando */
  loading: boolean;
}

/** Converte geographic_path para URL pública removendo o prefixo /br */
function toPublicPath(geoPath: string): string {
  const parts = geoPath.split('/').filter(Boolean);
  if (parts.length === 0) return '/';

  const startsWithCountry = parts[0].toLowerCase() === 'br';
  const publicParts = startsWithCountry ? parts.slice(1) : parts;

  return '/' + publicParts.join('/');
}

export function useUserTerritory(): UserTerritory {
  const { user } = useAuth();

  // 1. Buscar a residência primária do usuário (apenas o location_id)
  const { data: residence, isLoading: residenceLoading } = useQuery({
    queryKey: ['user-residence', 'primary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const data = await residenceService.getPrimaryResidence(user.id);
      if (!data?.location_id) return null;
      return { location_id: data.location_id } as { location_id: string };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Resolver o district e seu parent (city) pelo UUID
  const { data: resolved, isLoading: locationLoading } = useQuery({
    queryKey: ['user-territory-resolved', residence?.location_id],
    queryFn: async () => {
      if (!residence?.location_id) return null;
      const repo = createLocationRepository();

      // Busca o district
      const district = await repo.findById(residence.location_id);
      if (!district) return null;

      // Busca a cidade (parent direto do district)
      const city = district.parent_id ? await repo.findById(district.parent_id) : null;

      return { district, city };
    },
    enabled: !!residence?.location_id,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => {
    const loading = residenceLoading || locationLoading;

    if (!user) return { homeDistrict: null, homeCity: null, hasHome: false, loading: false };
    if (loading) return { homeDistrict: null, homeCity: null, hasHome: false, loading: true };
    if (!resolved) return { homeDistrict: null, homeCity: null, hasHome: false, loading: false };

    const { district, city } = resolved;

    return {
      homeDistrict: {
        id: district.id,
        name: district.name,
        path: toPublicPath(district.geographic_path),
      },
      homeCity: city ? {
        id: city.id,
        name: city.name,
        path: toPublicPath(city.geographic_path),
      } : null,
      hasHome: true,
      loading: false,
    };
  }, [user, resolved, residenceLoading, locationLoading]);
}
