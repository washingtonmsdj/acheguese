/**
 * useModuleLocation - Hook genérico para integração de módulos com fundação geográfica
 * 
 * SSOT: Substitui useBusinessLocation, useServicesLocation, useClassifiedsLocation, useCommunityLocation.
 * 
 * Responsabilidades:
 * - Obter localização ativa do contexto
 * - Validar localização para criação/edição
 * - Fornecer parâmetros de filtro por localização
 * - Subscrever a mudanças de localização
 * 
 * @template T - Tipo do LocationService (deve estender BaseLocationService)
 * @param service - Instância do LocationService do módulo
 * 
 * @example
 * // Em useBusinessLocation.ts
 * export function useBusinessLocation() {
 *   return useModuleLocation(businessLocationService);
 * }
 */

import { useState, useEffect, useCallback } from 'react';
import type { BaseLocationService } from '../services/BaseLocationService';
import type { Location } from '../types';

export function useModuleLocation<T extends BaseLocationService>(service: T) {
  const [activeLocation, setActiveLocation] = useState<Location | null>(
    () => service.getActiveLocation()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar localização ativa
  const refreshActiveLocation = useCallback(() => {
    setActiveLocation(service.getActiveLocation());
  }, [service]);

  // Subscrever a mudanças de localização
  useEffect(() => {
    const unsubscribe = service.subscribe(() => {
      setActiveLocation(service.getActiveLocation());
    });
    
    // Garantir que está sincronizado no mount
    setActiveLocation(service.getActiveLocation());
    
    return unsubscribe;
  }, [service]);

  // Validar location_id
  const validateLocationId = useCallback(
    async (locationId: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        return await service.validateLocationId(locationId);
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  // Obter parâmetros de filtro (síncrono)
  const getFilterParams = useCallback(() => {
    return service.getFilterParams();
  }, [service]);

  // Obter comportamento padrão
  const getDefaultBehavior = useCallback(() => {
    return service.getDefaultBehavior();
  }, [service]);

  return {
    // Estado
    activeLocation,
    isLoading,
    hasActiveLocation: activeLocation !== null,
    activeLocationId: activeLocation?.id || null,
    activeLocationName: service.getActiveLocationName(),

    // Métodos
    refreshActiveLocation,
    validateLocationId,
    getFilterParams,
    getDefaultBehavior,

    // Computed
    filterScope: service.getFilterScope(),
    canCreate: activeLocation !== null,
    isCity: service.isCity(),
    isDistrict: service.isDistrict(),
  };
}
