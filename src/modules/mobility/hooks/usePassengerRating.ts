/**
 * usePassengerRating
 * 
 * Hook para buscar avaliação média do passageiro
 * Substitui acesso direto ao banco em PassageiroPage
 * 
 * SSOT: Database → MobilityService → Hook → Component
 */

import { useQuery } from '@tanstack/react-query';
import { getPassengerRating } from '../services/mobility.queries';
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from '../constants';

export function usePassengerRating(profileId: string | null | undefined) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.passengerRating(profileId!),
    queryFn: () => getPassengerRating(profileId!),
    enabled: !!profileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG, // 10 minutos
  });
}
