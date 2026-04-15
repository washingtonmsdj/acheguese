/**
 * useVagasLocation
 *
 * Hook para integração do módulo vagas com a fundação geográfica SSOT.
 * Responsável por:
 * - Obter localização ativa do contexto territorial
 * - Validar location_id para criação/edição de vaga
 * - Fornecer informações sobre a localização ativa
 */

import { useMemo } from 'react';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';

export function useVagasLocation() {
  const { activeLocation, isLoading } = useActiveTerritory();

  const hasActiveLocation = useMemo(() => {
    return activeLocation !== null && activeLocation !== undefined;
  }, [activeLocation]);

  const activeLocationId = useMemo(() => {
    return activeLocation?.id || null;
  }, [activeLocation]);

  const activeLocationName = useMemo(() => {
    return activeLocation?.full_name || null;
  }, [activeLocation]);

  const canCreateVaga = useMemo(() => {
    return hasActiveLocation;
  }, [hasActiveLocation]);

  return {
    activeLocation,
    isLoading,
    hasActiveLocation,
    activeLocationId,
    activeLocationName,
    canCreateVaga,
  };
}
