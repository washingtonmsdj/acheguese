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
import { LocationType } from '@/core/location/types';
import { profileService } from '@/core/profiles/services/ProfileService';
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

  // 1.1 Fallback SSOT: location_id do perfil ativo (quando não há residência primária)
  const { data: profileLocation, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile-location', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profile = await profileService.getActiveProfile(user.id);
      if (!profile?.location_id) return null;
      return { location_id: profile.location_id } as { location_id: string };
    },
    enabled: !!user?.id && !residence?.location_id,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveLocationId = residence?.location_id ?? profileLocation?.location_id ?? null;

  // 2. Resolver o district e seu parent (city) pelo UUID
  const { data: resolved, isLoading: locationLoading } = useQuery({
    queryKey: ['user-territory-resolved', effectiveLocationId],
    queryFn: async () => {
      if (!effectiveLocationId) return null;
      const repo = createLocationRepository();

      const location = await repo.findById(effectiveLocationId);
      if (!location) return null;

      if (location.type === LocationType.DISTRICT) {
        const city = location.parent_id ? await repo.findById(location.parent_id) : null;
        return { district: location, city };
      }

      if (location.type === LocationType.CITY) {
        return { district: null, city: location };
      }

      return null;
    },
    enabled: !!effectiveLocationId,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => {
    const loading = residenceLoading || profileLoading || locationLoading;

    if (!user) return { homeDistrict: null, homeCity: null, hasHome: false, loading: false };
    if (loading) return { homeDistrict: null, homeCity: null, hasHome: false, loading: true };
    if (!resolved) return { homeDistrict: null, homeCity: null, hasHome: false, loading: false };

    const { district, city } = resolved;

    return {
      homeDistrict: district
        ? {
            id: district.id,
            name: district.name,
            path: toPublicPath(district.geographic_path),
          }
        : null,
      homeCity: city ? {
        id: city.id,
        name: city.name,
        path: toPublicPath(city.geographic_path),
      } : null,
      hasHome: Boolean(district || city),
      loading: false,
    };
  }, [user, resolved, residenceLoading, profileLoading, locationLoading]);
}
