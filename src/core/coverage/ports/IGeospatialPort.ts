/**
 * Geospatial Port - Abstract Interface
 * 
 * Contrato abstrato para cálculos geoespaciais.
 * Implementado por integrations/maps.
 * Consumido por core/coverage.
 */

// ============================================
// ERROR TYPES
// ============================================

export enum GeospatialErrorCode {
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  COORDINATES_NOT_FOUND = 'COORDINATES_NOT_FOUND',
  INVALID_RADIUS = 'INVALID_RADIUS',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
}

export interface GeospatialError {
  code: GeospatialErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// PORT INTERFACE
// ============================================

export interface IGeospatialPort {
  /**
   * Verifica se target está dentro do raio a partir de origin
   * 
   * @param origin_location_id - ID da localização de origem
   * @param target_location_id - ID da localização alvo
   * @param radius_km - Raio em quilômetros
   * 
   * @returns true se target está dentro do raio, false caso contrário
   * 
   * @throws GeospatialError com code LOCATION_NOT_FOUND
   * @throws GeospatialError com code COORDINATES_NOT_FOUND
   * @throws GeospatialError com code INVALID_RADIUS
   */
  isWithinRadius(
    origin_location_id: string,
    target_location_id: string,
    radius_km: number
  ): Promise<boolean>;

  /**
   * Calcula distância entre duas localizações
   * 
   * @param location_id_a - ID da primeira localização
   * @param location_id_b - ID da segunda localização
   * 
   * @returns distância em quilômetros
   * 
   * @throws GeospatialError com code LOCATION_NOT_FOUND
   * @throws GeospatialError com code COORDINATES_NOT_FOUND
   */
  calculateDistance(
    location_id_a: string,
    location_id_b: string
  ): Promise<number>;
}
