/**
 * GeospatialService
 * 
 * SSOT para operações geoespaciais.
 * 
 * Responsabilidades:
 * - Resolver ponto geográfico para território
 * - Gerenciar boundaries de locations
 * - Fallback por proximidade quando boundary não disponível
 * 
 * Regras:
 * - Resolução por boundary tem prioridade (confidence 1.0)
 * - Fallback por proximidade tem confidence 0.5
 * - Geoespacial ajuda a resolver; não substitui governança territorial
 */

import type { IGeospatialRepository } from '../repositories/IGeospatialRepository';
import { createGeospatialRepository } from '../repositories/createGeospatialRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { 
  PointResolutionResult, 
  ResolvePointInput,
  BoundaryGeoJSON,
  Coordinates,
} from '../types';

export class GeospatialService {
  private repository: IGeospatialRepository;
  private locationRepository: ILocationRepository;

  constructor(repository?: IGeospatialRepository, locationRepository?: ILocationRepository) {
    this.repository = repository ?? createGeospatialRepository();
    this.locationRepository = locationRepository ?? createLocationRepository();
  }

  /**
   * Resolver ponto para território por containment (boundary)
   * 
   * Retorna null se não encontrar território com boundary que contenha o ponto.
   */
  async resolvePointToLocation(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    this.validateCoordinates(input.latitude, input.longitude);
    return await this.repository.resolvePointToLocation(input);
  }

  /**
   * Resolver ponto para território com fallback por proximidade
   * 
   * Tenta primeiro por boundary (confidence 1.0).
   * Se não encontrar, busca território mais próximo por canonical_lat/lng (confidence 0.5).
   */
  async resolvePointToLocationWithFallback(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    this.validateCoordinates(input.latitude, input.longitude);
    return await this.repository.resolvePointToLocationWithFallback(input);
  }

  /**
   * Verificar se location tem boundary definido
   */
  async hasBoundary(locationId: string): Promise<boolean> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.hasBoundary(locationId);
  }

  /**
   * Definir boundary de location
   * 
   * Regras:
   * - Location deve existir
   * - Boundary deve ser polígono válido
   */
  async setLocationBoundary(locationId: string, boundary: BoundaryGeoJSON): Promise<void> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }

    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    this.validateBoundary(boundary);

    await this.repository.setLocationBoundary(locationId, boundary);
  }

  /**
   * Obter boundary de location como GeoJSON
   */
  async getLocationBoundary(locationId: string): Promise<BoundaryGeoJSON | null> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.getLocationBoundary(locationId);
  }

  /**
   * Converter coordenadas para ponto GeoJSON
   */
  coordinatesToGeoJSON(coords: Coordinates): { type: 'Point'; coordinates: [number, number] } {
    this.validateCoordinates(coords.latitude, coords.longitude);
    return {
      type: 'Point',
      coordinates: [coords.longitude, coords.latitude],
    };
  }

  // ============================================
  // VALIDATIONS
  // ============================================

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  private validateBoundary(boundary: BoundaryGeoJSON): void {
    if (boundary.type !== 'Polygon') {
      throw new Error('Boundary must be a Polygon');
    }
    if (!boundary.coordinates || boundary.coordinates.length === 0) {
      throw new Error('Boundary must have coordinates');
    }
    const outerRing = boundary.coordinates.at(0);
    if (!outerRing || outerRing.length < 4) {
      throw new Error('Polygon must have at least 4 points (including closing point)');
    }

    // Validar que primeiro e último ponto são iguais (polígono fechado)
    const first = outerRing.at(0);
    const last = outerRing.at(-1);
    if (!first || !last) {
      throw new Error('Polygon must have at least 4 points (including closing point)');
    }

    const [firstLongitude, firstLatitude] = first;
    const [lastLongitude, lastLatitude] = last;
    if (firstLongitude !== lastLongitude || firstLatitude !== lastLatitude) {
      throw new Error('Polygon must be closed (first and last points must be equal)');
    }
  }
}

export const geospatialService = new GeospatialService();
