/**
 * IGeospatialRepository
 * 
 * Contrato de persistência para operações geoespaciais.
 */

import type { 
  PointResolutionResult, 
  ResolvePointInput,
  BoundaryGeoJSON,
} from '../types';

export interface IGeospatialRepository {
  /**
   * Resolver ponto para território por containment (boundary)
   */
  resolvePointToLocation(input: ResolvePointInput): Promise<PointResolutionResult | null>;
  
  /**
   * Resolver ponto para território com fallback por proximidade
   */
  resolvePointToLocationWithFallback(input: ResolvePointInput): Promise<PointResolutionResult | null>;
  
  /**
   * Verificar se location tem boundary definido
   */
  hasBoundary(locationId: string): Promise<boolean>;
  
  /**
   * Definir boundary de location
   */
  setLocationBoundary(locationId: string, boundary: BoundaryGeoJSON): Promise<void>;
  
  /**
   * Obter boundary de location como GeoJSON
   */
  getLocationBoundary(locationId: string): Promise<BoundaryGeoJSON | null>;
}
