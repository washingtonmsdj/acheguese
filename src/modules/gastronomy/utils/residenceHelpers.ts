/**
 * Residence Helpers for Gastronomy
 * 
 * Utilitários para trabalhar com residências do usuário no contexto de gastronomia
 */

import { residenceService, type UserResidenceWithRelations } from '@/core/residence/services/ResidenceService';
import { isFiniteCoordinate } from './coordinates';

/**
 * Extrai coordenadas de referência de uma residência
 * Tenta primeiro coordenadas exatas, depois centro da localização
 */
export function getResidenceReferenceCoords(
  residence: UserResidenceWithRelations | null,
): { latitude: number; longitude: number } | null {
  if (!residence) {
    return null;
  }

  // Tentar coordenadas exatas primeiro
  const exactCoords = residenceService.getCoordinates(residence);
  if (exactCoords) {
    return exactCoords;
  }

  // Fallback para centro da localização
  const centerLatitude =
    typeof residence.location?.metadata?.center_latitude === 'number'
      ? residence.location.metadata.center_latitude
      : null;
  const centerLongitude =
    typeof residence.location?.metadata?.center_longitude === 'number'
      ? residence.location.metadata.center_longitude
      : null;

  if (isFiniteCoordinate(centerLatitude) && isFiniteCoordinate(centerLongitude)) {
    return {
      latitude: centerLatitude,
      longitude: centerLongitude,
    };
  }

  return null;
}

/**
 * Gera um label descritivo para a residência
 */
export function getResidenceReferenceLabel(residence: UserResidenceWithRelations | null): string | null {
  if (!residence) {
    return null;
  }

  const formatted = residenceService.getFormattedAddress(residence);
  if (formatted && formatted !== 'Endereco nao disponivel') {
    return formatted;
  }

  if (residence.location?.name) {
    return `Residencia em ${residence.location.name}`;
  }

  return 'Residencia principal';
}
