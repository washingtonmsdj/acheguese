/**
 * useDriverCompleteProfile
 * 
 * Hook para buscar perfil completo do motorista
 * Substitui acesso direto ao banco em TrackRidePage
 * 
 * SSOT: Database → MobilityService → Hook → Component
 */

import { useQuery } from '@tanstack/react-query';
import { getDriverCompleteProfile } from '@/core/mobility/services/mobility.queries';
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from '@/core/mobility/constants';

export function useDriverCompleteProfile(profileId: string | null | undefined) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.driverCompleteProfile(profileId!),
    queryFn: () => getDriverCompleteProfile(profileId!),
    enabled: !!profileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });
}
