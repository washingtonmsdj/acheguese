/**
 * useCommunityTerritory
 *
 * Hook específico para o módulo Comunidade.
 * Retorna o território baseado no location_id do perfil do usuário (onde ele mora).
 *
 * Diferente das páginas públicas que usam o território navegado,
 * a Comunidade sempre mostra conteúdo do bairro onde o usuário mora.
 */

import { useEffect, useState } from 'react';
import { useSessionContext } from '@/core/session/hooks/useSessionContext';
import { LocationService } from '@/core/location/services/LocationService';
import type { Location } from '@/core/location/types';

export function useCommunityTerritory() {
  const { activeProfile } = useSessionContext();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUserLocation = async () => {
      if (!activeProfile?.location_id) {
        setUserLocation(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const location = await LocationService.getLocationById(activeProfile.location_id);
        setUserLocation(location);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user location'));
        setUserLocation(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserLocation();
  }, [activeProfile?.location_id]);

  return {
    userLocation,
    isLoading,
    error,
    hasLocation: !!userLocation,
  };
}
