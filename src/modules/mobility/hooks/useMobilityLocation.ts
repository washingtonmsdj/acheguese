/**
 * useMobilityLocation
 *
 * Expõe o contexto geográfico do app para o módulo mobility.
 * NÃO expõe localização GPS do motorista — isso é responsabilidade de useDriverLocation.
 *
 * Etapa 5: expõe TerritoryFilter para uso em queries de rotas/corridas.
 * Mobility opera por CITY — district é promovido para cidade pai.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mobilityLocationService } from '../services/MobilityLocationService';
import { useLocationContext } from '@/core/location/hooks/useLocationContext';
import type { TerritoryFilter } from '@/core/location/types';
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from '../constants';

export function useMobilityLocation() {
  // Reage a mudanças no contexto geográfico ativo
  const { activeLocation } = useLocationContext();

  const locationId = activeLocation?.id ?? null;
  const locationName = activeLocation?.name ?? null;
  const hasActiveLocation = activeLocation !== null;
  const filterScope = mobilityLocationService.getFilterScope();
  const defaultBehavior = mobilityLocationService.getDefaultBehavior();

  // Resolve district → city de forma assíncrona.
  // operationalLocationId é sempre um city_id — nunca um district_id.
  const { data: operationalLocationId = null } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.operationalLocation(locationId!),
    queryFn: () => mobilityLocationService.getOperationalLocationId(),
    enabled: hasActiveLocation,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  // TerritoryFilter para mobility — sempre scope: 'location' com city_id
  // Mobility não suporta group (rotas cruzam bairros, operam por cidade)
  const territoryFilter = useMemo((): TerritoryFilter => {
    if (!operationalLocationId) return { scope: 'none' };
    return { scope: 'location', location_id: operationalLocationId };
  }, [operationalLocationId]);

  return {
    /** Localização de contexto do app (district/city) — NÃO é GPS */
    activeLocation,
    /** location_id bruto do contexto (pode ser district) */
    locationId,
    /** city_id resolvido — district é promovido para cidade pai */
    operationalLocationId,
    locationName,
    hasActiveLocation,
    filterScope,
    defaultBehavior,
    /**
     * TerritoryFilter pronto para uso em queries de mobility.
     * Sempre scope: 'location' com city_id (nunca group).
     */
    territoryFilter,
  };
}
