/**
 * useMobilityRollout
 *
 * Expõe o estado de rollout do módulo mobility para a localização de contexto atual.
 */

import { useQuery } from '@tanstack/react-query';
import { mobilityRolloutService } from '../services/MobilityRolloutService';
import { useMobilityLocation } from './useMobilityLocation';
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from '../constants';

export function useMobilityRollout() {
  const { locationId, hasActiveLocation } = useMobilityLocation();

  const {
    data: isActive = false,
    isLoading: isLoadingRollout,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.mobilityRollout(locationId!),
    queryFn: () => mobilityRolloutService.isMobilityActive(),
    enabled: hasActiveLocation,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  const {
    data: access,
    isLoading: isLoadingAccess,
  } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.mobilityRolloutAccess(locationId!),
    queryFn: () => mobilityRolloutService.checkAccess(),
    enabled: hasActiveLocation,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  return {
    /** Mobility está ativo na localização atual */
    isMobilityActive: isActive,
    /** Acesso bloqueado e motivo */
    isBlocked: access?.blocked ?? !hasActiveLocation,
    blockReason: access?.reason,
    isLoading: isLoadingRollout || isLoadingAccess,
  };
}
