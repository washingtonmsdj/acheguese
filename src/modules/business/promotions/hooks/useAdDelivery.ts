/**
 * useAdDelivery
 *
 * Hook principal para entrega de anúncios.
 * Consome AdDeliveryService e expõe o resultado para componentes.
 *
 * Uso:
 *   const { campaign, resolutionSource, isLoading } = useAdDelivery('feed_sponsored');
 *   const { campaign } = useAdDelivery('sidebar_widget', profile?.primary_location_id);
 */

import { useQuery } from '@tanstack/react-query';
import { adDeliveryService } from '../services';
import type { AdPlacementKey, AdCampaignWithTargets, AdResolutionResult } from '../types';

interface UseAdDeliveryOptions {
  /** primary_location_id do perfil para fallback quando não há localização ativa */
  fallbackLocationId?: string | null;
  /** Desabilitar a query manualmente */
  enabled?: boolean;
}

interface UseAdDeliveryReturn {
  campaign: AdCampaignWithTargets | null;
  resolutionSource: AdResolutionResult['resolution_source'];
  isLoading: boolean;
  error: Error | null;
  /** Indica se há localização ativa (district ou city) */
  hasActiveLocation: boolean;
  /** ID da localização ativa */
  activeLocationId: string | null;
}

export function useAdDelivery(
  placement_key: AdPlacementKey,
  options: UseAdDeliveryOptions = {}
): UseAdDeliveryReturn {
  const { fallbackLocationId = null, enabled = true } = options;

  const activeLocationId = adDeliveryService.getActiveLocationId();
  const hasActiveLocation = adDeliveryService.hasActiveLocation();

  const { data, isLoading, error } = useQuery({
    // Cache por placement + localização ativa + fallback
    queryKey: ['ads', placement_key, activeLocationId, fallbackLocationId],
    queryFn: () => adDeliveryService.getAdForPlacement(placement_key, fallbackLocationId),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000,
  });

  return {
    campaign: data?.campaign ?? null,
    resolutionSource: data?.resolution_source ?? 'none',
    isLoading,
    error: error as Error | null,
    hasActiveLocation,
    activeLocationId,
  };
}
