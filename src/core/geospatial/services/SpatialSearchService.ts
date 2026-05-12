/**
 * SpatialSearchService - SSOT para busca espacial
 * 
 * Responsabilidades:
 * - Busca por raio (distância)
 * - Busca por bounding box (viewport)
 * - Busca híbrida (raio + território)
 * - Ordenação por proximidade
 * - Cálculo de distâncias
 * 
 * Regras:
 * - Todas as coordenadas em WGS84 (SRID 4326)
 * - Distâncias em metros
 * - Raios em quilômetros
 * - Usa PostGIS para performance
 * 
 * @module core/geospatial/services
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
// ============================================
// TYPES
// ============================================

export type EntityType = 
  | 'business' 
  | 'classified' 
  | 'event' 
  | 'alert' 
  | 'tourist_point';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface SpatialSearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  location_id?: string;
  in_territory?: boolean;
  slug?: string; // Para construção de URLs canônicas
}

export interface SearchByRadiusInput {
  center: Coordinates;
  radiusKm: number;
  entityType: EntityType;
  locationId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchByBoundsInput {
  bounds: BoundingBox;
  entityType: EntityType;
  locationId?: string;
  limit?: number;
}

export interface SearchHybridInput {
  center: Coordinates;
  radiusKm: number;
  entityType: EntityType;
  locationIds?: string[];
  limit?: number;
}

interface SpatialSearchRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_meters?: number | null;
  location_id?: string | null;
  in_territory?: boolean | null;
  slug?: string | null;
}

// ============================================
// SERVICE
// ============================================

export class SpatialSearchService {
  /**
   * Busca entidades dentro de um raio específico
   * 
   * @example
   * ```ts
   * const results = await spatialSearchService.searchByRadius({
   *   center: { latitude: -12.9714, longitude: -38.5014 },
   *   radiusKm: 2,
   *   entityType: 'business',
   *   limit: 20
   * });
   * ```
   */
  async searchByRadius(input: SearchByRadiusInput): Promise<SpatialSearchResult[]> {
    this.validateCoordinates(input.center);
    this.validateRadius(input.radiusKm);

    const { data, error } = await supabase.rpc('search_entities_by_radius', {
      p_latitude: input.center.latitude,
      p_longitude: input.center.longitude,
      p_radius_km: input.radiusKm,
      p_entity_type: input.entityType,
      p_location_id: input.locationId ?? null,
      p_limit: input.limit ?? 50,
      p_offset: input.offset ?? 0,
    });

    if (error) {
      logger.error('[SpatialSearchService] searchByRadius error:', error);
      throw new Error(`Erro ao buscar por raio: ${error.message}`);
    }

    return (data || []).map(this.mapResult);
  }

  /**
   * Busca entidades dentro de um bounding box (viewport do mapa)
   * 
   * @example
   * ```ts
   * const results = await spatialSearchService.searchByBounds({
   *   bounds: { west: -38.52, south: -12.98, east: -38.48, north: -12.96 },
   *   entityType: 'business',
   *   limit: 100
   * });
   * ```
   */
  async searchByBounds(input: SearchByBoundsInput): Promise<SpatialSearchResult[]> {
    this.validateBounds(input.bounds);

    const { data, error } = await supabase.rpc('search_entities_by_bounds', {
      p_west: input.bounds.west,
      p_south: input.bounds.south,
      p_east: input.bounds.east,
      p_north: input.bounds.north,
      p_entity_type: input.entityType,
      p_location_id: input.locationId ?? null,
      p_limit: input.limit ?? 100,
    });

    if (error) {
      logger.error('[SpatialSearchService] searchByBounds error:', error);
      throw new Error(`Erro ao buscar por bounds: ${error.message}`);
    }

    return (data || []).map(this.mapResult);
  }

  /**
   * Busca híbrida: combina raio de distância com priorização territorial
   * 
   * Entidades dentro do território aparecem primeiro, seguidas por proximidade.
   * 
   * @example
   * ```ts
   * const results = await spatialSearchService.searchHybrid({
   *   center: { latitude: -12.9714, longitude: -38.5014 },
   *   radiusKm: 5,
   *   entityType: 'business',
   *   locationIds: ['loc-pituba', 'loc-barra'],
   *   limit: 30
   * });
   * ```
   */
  async searchHybrid(input: SearchHybridInput): Promise<SpatialSearchResult[]> {
    this.validateCoordinates(input.center);
    this.validateRadius(input.radiusKm);

    const { data, error } = await supabase.rpc('search_entities_hybrid', {
      p_latitude: input.center.latitude,
      p_longitude: input.center.longitude,
      p_radius_km: input.radiusKm,
      p_entity_type: input.entityType,
      p_location_ids: input.locationIds ?? null,
      p_limit: input.limit ?? 50,
    });

    if (error) {
      logger.error('[SpatialSearchService] searchHybrid error:', error);
      throw new Error(`Erro ao buscar híbrido: ${error.message}`);
    }

    return (data || []).map(this.mapResult);
  }

  /**
   * Calcula distância em metros entre dois pontos
   * 
   * @example
   * ```ts
   * const distance = await spatialSearchService.calculateDistance(
   *   { latitude: -12.9714, longitude: -38.5014 },
   *   { latitude: -12.9800, longitude: -38.5100 }
   * );
   * logger.debug(`${(distance / 1000).toFixed(2)} km`);
   * ```
   */
  async calculateDistance(
    point1: Coordinates,
    point2: Coordinates
  ): Promise<number> {
    this.validateCoordinates(point1);
    this.validateCoordinates(point2);

    const { data, error } = await supabase.rpc('calculate_distance_meters', {
      p_lat1: point1.latitude,
      p_lng1: point1.longitude,
      p_lat2: point2.latitude,
      p_lng2: point2.longitude,
    });

    if (error) {
      logger.error('[SpatialSearchService] calculateDistance error:', error);
      throw new Error(`Erro ao calcular distância: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Ordena entidades por proximidade a um ponto
   * 
   * Útil quando você já tem uma lista de entidades e quer ordená-las por distância.
   */
  async orderByProximity(
    center: Coordinates,
    entities: Array<{ id: string; latitude: number; longitude: number }>
  ): Promise<Array<{ id: string; distance_meters: number }>> {
    this.validateCoordinates(center);

    const results = await Promise.all(
      entities.map(async (entity) => {
        const distance = await this.calculateDistance(center, {
          latitude: entity.latitude,
          longitude: entity.longitude,
        });
        return { id: entity.id, distance_meters: distance };
      })
    );

    return results.sort((a, b) => a.distance_meters - b.distance_meters);
  }

  // ============================================
  // HELPERS
  // ============================================

  private validateCoordinates(coords: Coordinates): void {
    if (
      typeof coords.latitude !== 'number' ||
      typeof coords.longitude !== 'number'
    ) {
      throw new Error('Coordenadas inválidas: latitude e longitude devem ser números');
    }

    if (coords.latitude < -90 || coords.latitude > 90) {
      throw new Error(`Latitude inválida: ${coords.latitude} (deve estar entre -90 e 90)`);
    }

    if (coords.longitude < -180 || coords.longitude > 180) {
      throw new Error(`Longitude inválida: ${coords.longitude} (deve estar entre -180 e 180)`);
    }
  }

  private validateRadius(radiusKm: number): void {
    if (typeof radiusKm !== 'number' || radiusKm <= 0) {
      throw new Error(`Raio inválido: ${radiusKm} (deve ser um número positivo)`);
    }

    if (radiusKm > 100) {
      throw new Error(`Raio muito grande: ${radiusKm} km (máximo 100 km)`);
    }
  }

  private validateBounds(bounds: BoundingBox): void {
    if (
      typeof bounds.west !== 'number' ||
      typeof bounds.south !== 'number' ||
      typeof bounds.east !== 'number' ||
      typeof bounds.north !== 'number'
    ) {
      throw new Error('Bounding box inválido: todos os valores devem ser números');
    }

    if (bounds.west >= bounds.east) {
      throw new Error('Bounding box inválido: west deve ser menor que east');
    }

    if (bounds.south >= bounds.north) {
      throw new Error('Bounding box inválido: south deve ser menor que north');
    }
  }

  private mapResult(row: SpatialSearchRow): SpatialSearchResult {
    return {
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      distance_meters: row.distance_meters ?? undefined,
      location_id: row.location_id ?? undefined,
      in_territory: row.in_territory ?? undefined,
      slug: row.slug ?? undefined,
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const spatialSearchService = new SpatialSearchService();
