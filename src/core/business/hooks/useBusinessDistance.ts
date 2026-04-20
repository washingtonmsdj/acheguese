/**
 * useBusinessDistance
 * 
 * Hook para calcular distâncias entre a posição do usuário e empresas.
 * Adiciona campo `distance` (em metros) a cada empresa.
 * 
 * SSOT para cálculo de distâncias no módulo de empresas.
 */

import { useMemo } from 'react';
import { calculateDistance } from '@/shared/utils/geolocation';
import type { Business } from '@/core/business/types/Business';
import type { UserPosition } from './useUserPosition';

export interface BusinessWithDistance extends Business {
  /** Distância em metros da posição do usuário */
  distance: number | null;
}

/**
 * Calcula distância entre usuário e empresa
 */
function calculateBusinessDistance(
  business: Business,
  userPosition: UserPosition
): number | null {
  // Tenta obter coordenadas do address
  const lat = business.address?.latitude;
  const lng = business.address?.longitude;
  
  if (lat == null || lng == null) {
    return null; // Empresa sem coordenadas
  }
  
  return calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    lat,
    lng
  );
}

/**
 * Hook que adiciona distância a cada empresa e permite ordenação
 */
export function useBusinessDistance(
  businesses: Business[],
  userPosition: UserPosition | null
): BusinessWithDistance[] {
  return useMemo(() => {
    if (!userPosition) {
      // Sem posição do usuário, retorna empresas sem distância
      return businesses.map(business => ({
        ...business,
        distance: null,
      }));
    }
    
    // Calcula distância para cada empresa
    return businesses.map(business => ({
      ...business,
      distance: calculateBusinessDistance(business, userPosition),
    }));
  }, [businesses, userPosition]);
}

/**
 * Hook que ordena empresas por distância
 */
export function useSortedByDistance(
  businesses: BusinessWithDistance[]
): BusinessWithDistance[] {
  return useMemo(() => {
    // Separa empresas com e sem distância
    const withDistance = businesses.filter(b => b.distance !== null);
    const withoutDistance = businesses.filter(b => b.distance === null);
    
    // Ordena as que têm distância
    const sorted = [...withDistance].sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
    
    // Retorna ordenadas + sem distância no final
    return [...sorted, ...withoutDistance];
  }, [businesses]);
}

/**
 * Hook que filtra empresas dentro de um raio (em metros)
 */
export function useBusinessesWithinRadius(
  businesses: BusinessWithDistance[],
  radiusMeters: number
): BusinessWithDistance[] {
  return useMemo(() => {
    return businesses.filter(business => {
      if (business.distance === null) return false;
      return business.distance <= radiusMeters;
    });
  }, [businesses, radiusMeters]);
}
