// @ts-nocheck
/**
 * CoverageService - SSOT para área de cobertura geográfica
 * 
 * Responsabilidades:
 * - Verificar se entidade atende uma localização
 * - Gerenciar áreas de cobertura (por bairro, raio, polígono)
 * - Listar entidades que atendem uma localização
 * - Adicionar/remover cobertura
 * 
 * Regras:
 * - Cobertura pode ser por: location (bairro), radius (raio), polygon (polígono)
 * - Múltiplas áreas de cobertura por entidade
 * - Soft delete (is_active = false)
 * 
 * @module core/geospatial/services
 */

import { supabase } from '@/integrations/supabase';

// ============================================
// TYPES
// ============================================

export type CoverageEntityType = 
  | 'business' 
  | 'professional' 
  | 'driver' 
  | 'classified';

export type CoverageType = 'location' | 'radius' | 'polygon';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CoverageCheckResult {
  has_coverage: boolean;
  coverage_type?: CoverageType;
  distance_meters?: number;
  location_id?: string;
}

export interface CoverageArea {
  id: string;
  coverage_type: CoverageType;
  location_id?: string;
  location_name?: string;
  center_latitude?: number;
  center_longitude?: number;
  radius_km?: number;
  is_active: boolean;
}

export interface CheckCoverageInput {
  entityType: CoverageEntityType;
  entityId: string;
  userLocation: Coordinates;
}

export interface AddCoverageByRadiusInput {
  entityType: CoverageEntityType;
  entityId: string;
  center: Coordinates;
  radiusKm: number;
}

export interface AddCoverageByLocationInput {
  entityType: CoverageEntityType;
  entityId: string;
  locationId: string;
}

export interface FindEntitiesWithCoverageInput {
  entityType: CoverageEntityType;
  userLocation: Coordinates;
  limit?: number;
}

// ============================================
// SERVICE
// ============================================

export class CoverageService {
  private static prefersDirectCoverageAreasQuery = true;
  /**
   * Verifica se uma entidade atende uma localização específica
   * 
   * @example
   * ```ts
   * const result = await coverageService.checkCoverage({
   *   entityType: 'business',
   *   entityId: 'biz-123',
   *   userLocation: { latitude: -12.9714, longitude: -38.5014 }
   * });
   * 
   * if (result.has_coverage) {
   *   console.log('Atende sua região!');
   * }
   * ```
   */
  async checkCoverage(input: CheckCoverageInput): Promise<CoverageCheckResult> {
    this.validateCoordinates(input.userLocation);

    const { data, error } = await supabase.rpc('check_coverage', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_user_latitude: input.userLocation.latitude,
      p_user_longitude: input.userLocation.longitude,
    });

    if (error) {
      console.error('[CoverageService] checkCoverage error:', error);
      throw new Error(`Erro ao verificar cobertura: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { has_coverage: false };
    }

    const result = data[0];
    return {
      has_coverage: result.has_coverage,
      coverage_type: result.coverage_type ?? undefined,
      distance_meters: result.distance_meters ?? undefined,
      location_id: result.location_id ?? undefined,
    };
  }

  /**
   * Lista todas as áreas de cobertura de uma entidade
   * 
   * @example
   * ```ts
   * const areas = await coverageService.getCoverageAreas('business', 'biz-123');
   * areas.forEach(area => {
   *   if (area.coverage_type === 'radius') {
   *     console.log(`Raio de ${area.radius_km} km`);
   *   } else if (area.coverage_type === 'location') {
   *     console.log(`Bairro: ${area.location_name}`);
   *   }
   * });
   * ```
   */
  async getCoverageAreas(
    entityType: CoverageEntityType,
    entityId: string
  ): Promise<CoverageArea[]> {
    if (CoverageService.prefersDirectCoverageAreasQuery) {
      return this.getCoverageAreasFromTable(entityType, entityId);
    }

    const rpcResult = await supabase.rpc('get_coverage_areas', {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });

    if (!rpcResult.error) {
      return (rpcResult.data || []).map(this.mapCoverageArea);
    }

    const errorCode = String(rpcResult.error.code ?? '');
    const errorMessage = String(rpcResult.error.message ?? '');
    (rpcResult.error as { code?: string }).code = errorCode;
    const shouldFallbackToDirectQuery =
      rpcResult.error.code === '42703' || // coluna inexistente na função SQL
      rpcResult.error.code === '42883' || // função não existe / assinatura incorreta
      rpcResult.error.code === 'PGRST202'; // função RPC não encontrada

    const shouldFallbackByMessage = errorMessage.includes('sa.is_active');

    if (!shouldFallbackToDirectQuery && !shouldFallbackByMessage) {
      console.error('[CoverageService] getCoverageAreas error:', rpcResult.error);
      throw new Error(`Erro ao listar áreas de cobertura: ${rpcResult.error.message}`);
    }

    CoverageService.prefersDirectCoverageAreasQuery = true;

    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoverageService] getCoverageAreas fallback error:', error);
      throw new Error(`Erro ao listar áreas de cobertura: ${error.message}`);
    }

    return (data || []).map(this.mapCoverageArea);
  }

  /**
   * Adiciona área de cobertura por raio
   * 
   * @example
   * ```ts
   * const areaId = await coverageService.addCoverageByRadius({
   *   entityType: 'business',
   *   entityId: 'biz-123',
   *   center: { latitude: -12.9714, longitude: -38.5014 },
   *   radiusKm: 5
   * });
   * ```
   */
  async addCoverageByRadius(input: AddCoverageByRadiusInput): Promise<string> {
    this.validateCoordinates(input.center);
    this.validateRadius(input.radiusKm);

    const { data, error } = await supabase.rpc('add_coverage_by_radius', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_center_latitude: input.center.latitude,
      p_center_longitude: input.center.longitude,
      p_radius_km: input.radiusKm,
    });

    if (error) {
      console.error('[CoverageService] addCoverageByRadius error:', error);
      throw new Error(`Erro ao adicionar cobertura por raio: ${error.message}`);
    }

    return data as string;
  }

  /**
   * Adiciona área de cobertura por bairro/localidade
   * 
   * @example
   * ```ts
   * const areaId = await coverageService.addCoverageByLocation({
   *   entityType: 'business',
   *   entityId: 'biz-123',
   *   locationId: 'loc-pituba'
   * });
   * ```
   */
  async addCoverageByLocation(input: AddCoverageByLocationInput): Promise<string> {
    const { data, error } = await supabase.rpc('add_coverage_by_location', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_location_id: input.locationId,
    });

    if (error) {
      console.error('[CoverageService] addCoverageByLocation error:', error);
      throw new Error(`Erro ao adicionar cobertura por localidade: ${error.message}`);
    }

    return data as string;
  }

  /**
   * Remove (desativa) uma área de cobertura
   * 
   * @example
   * ```ts
   * await coverageService.removeCoverage('area-123');
   * ```
   */
  async removeCoverage(areaId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('remove_coverage', {
      p_area_id: areaId,
    });

    if (error) {
      console.error('[CoverageService] removeCoverage error:', error);
      throw new Error(`Erro ao remover cobertura: ${error.message}`);
    }

    return data as boolean;
  }

  /**
   * Encontra entidades que atendem uma localização específica
   * 
   * @example
   * ```ts
   * const entities = await coverageService.findEntitiesWithCoverage({
   *   entityType: 'business',
   *   userLocation: { latitude: -12.9714, longitude: -38.5014 },
   *   limit: 20
   * });
   * 
   * // Retorna IDs de empresas que atendem essa localização
   * ```
   */
  async findEntitiesWithCoverage(
    input: FindEntitiesWithCoverageInput
  ): Promise<Array<{ entity_id: string; coverage_type: CoverageType; distance_meters?: number }>> {
    this.validateCoordinates(input.userLocation);

    const { data, error } = await supabase.rpc('find_entities_with_coverage', {
      p_entity_type: input.entityType,
      p_user_latitude: input.userLocation.latitude,
      p_user_longitude: input.userLocation.longitude,
      p_limit: input.limit ?? 50,
    });

    if (error) {
      console.error('[CoverageService] findEntitiesWithCoverage error:', error);
      throw new Error(`Erro ao buscar entidades com cobertura: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      entity_id: row.entity_id,
      coverage_type: row.coverage_type,
      distance_meters: row.distance_meters ?? undefined,
    }));
  }

  /**
   * Verifica se entidade tem cobertura configurada
   */
  async hasCoverage(entityType: CoverageEntityType, entityId: string): Promise<boolean> {
    const areas = await this.getCoverageAreas(entityType, entityId);
    return areas.some((area) => area.is_active);
  }

  /**
   * Gera texto descritivo da cobertura para UI
   * 
   * @example
   * ```ts
   * const text = await coverageService.getCoverageDescription('business', 'biz-123');
   * // "Atende Pituba, Barra e raio de 5 km"
   * ```
   */
  async getCoverageDescription(
    entityType: CoverageEntityType,
    entityId: string
  ): Promise<string> {
    const areas = await this.getCoverageAreas(entityType, entityId);
    const activeAreas = areas.filter((a) => a.is_active);

    if (activeAreas.length === 0) {
      return 'Cobertura não configurada';
    }

    const parts: string[] = [];

    const locations = activeAreas
      .filter((a) => a.coverage_type === 'location' && a.location_name)
      .map((a) => a.location_name);

    if (locations.length > 0) {
      parts.push(locations.join(', '));
    }

    const radiusAreas = activeAreas.filter((a) => a.coverage_type === 'radius');
    if (radiusAreas.length > 0) {
      const maxRadius = Math.max(...radiusAreas.map((a) => a.radius_km || 0));
      parts.push(`raio de ${maxRadius} km`);
    }

    return `Atende ${parts.join(' e ')}`;
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getCoverageAreasFromTable(
    entityType: CoverageEntityType,
    entityId: string,
  ): Promise<CoverageArea[]> {
    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CoverageService] getCoverageAreas fallback error:', error);
      throw new Error(`Erro ao listar areas de cobertura: ${error.message}`);
    }

    return (data || []).map(this.mapCoverageArea);
  }

  private validateCoordinates(coords: Coordinates): void {
    if (
      typeof coords.latitude !== 'number' ||
      typeof coords.longitude !== 'number'
    ) {
      throw new Error('Coordenadas inválidas: latitude e longitude devem ser números');
    }

    if (coords.latitude < -90 || coords.latitude > 90) {
      throw new Error(`Latitude inválida: ${coords.latitude}`);
    }

    if (coords.longitude < -180 || coords.longitude > 180) {
      throw new Error(`Longitude inválida: ${coords.longitude}`);
    }
  }

  private validateRadius(radiusKm: number): void {
    if (typeof radiusKm !== 'number' || radiusKm <= 0) {
      throw new Error(`Raio inválido: ${radiusKm}`);
    }

    if (radiusKm > 50) {
      throw new Error(`Raio muito grande: ${radiusKm} km (máximo 50 km)`);
    }
  }

  private mapCoverageArea(row: any): CoverageArea {
    const isActive =
      typeof row.is_active === 'boolean'
        ? row.is_active
        : row.status
          ? row.status === 'active'
          : true;

    return {
      id: row.id,
      coverage_type: row.coverage_type,
      location_id: row.location_id ?? undefined,
      location_name: row.location_name ?? undefined,
      center_latitude: row.center_latitude ?? undefined,
      center_longitude: row.center_longitude ?? undefined,
      radius_km: row.radius_km ?? undefined,
      is_active: isActive,
    };
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const coverageService = new CoverageService();
