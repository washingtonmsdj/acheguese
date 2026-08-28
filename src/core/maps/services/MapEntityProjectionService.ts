/**
 * MapEntityProjectionService - Projeção de entidades para o mapa
 * 
 * SSOT para transformação de entidades do domínio em formato de mapa.
 * Centraliza a lógica de conversão para evitar duplicação.
 * 
 * Responsabilidades:
 * - Converter business → MapMarker
 * - Converter service → MapMarker
 * - Converter classified → MapMarker
 * - Converter event → MapMarker
 * - Converter alert → MapMarker
 * - Validar coordenadas
 * - Enriquecer com metadados
 * 
 * @module core/maps/services
 */
import { logger } from '@/shared/utils/logger';
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/shared/config/moduleSlugs';
import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';
import type { MapMarker, MapEntityType, MapEntityStatus, Coordinates } from '../types';
import { isValidCoordinates } from '../types';
// ============================================
// INPUT TYPES (Entidades do domínio)
// ============================================

/**
 * Interface base para entidades mapeáveis
 */
interface MappableEntity {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  slug?: string;
  [key: string]: unknown;
}

/**
 * Opções de projeção
 */
interface ProjectionOptions {
  /** Incluir metadados completos */
  includeMetadata?: boolean;
  /** Calcular score/relevância */
  calculateScore?: boolean;
  /** URL base para construir links */
  baseUrl?: string;
}

// ============================================
// SERVICE
// ============================================

export class MapEntityProjectionService {
  /**
   * Projeta uma entidade genérica para MapMarker
   */
  projectEntity(
    entity: MappableEntity,
    type: MapEntityType,
    options: ProjectionOptions = {}
  ): MapMarker | null {
    // Validar coordenadas
    const coordinates = this.extractCoordinates(entity);
    if (!coordinates) {
      logger.warn(`[MapEntityProjection] Entity ${entity.id} has invalid coordinates`);
      return null;
    }

    // Extrair status
    const status = this.normalizeStatus(entity.status);

    // Construir marker base
    const marker: MapMarker = {
      id: entity.id,
      type,
      coordinates,
      title: entity.name,
      status,
    };

    // Adicionar subtitle se disponível
    if (entity.subtitle || entity.description) {
      marker.subtitle = (entity.subtitle || entity.description) as string;
    }

    // Adicionar URL se disponível
    if (entity.slug && options.baseUrl) {
      marker.url = `${options.baseUrl}/${entity.slug}`;
    } else if (entity.url) {
      marker.url = entity.url as string;
    }

    // Adicionar premium flag
    if (entity.is_premium || entity.isPremium) {
      marker.isPremium = true;
    }

    // Adicionar score
    if (options.calculateScore) {
      marker.score = this.calculateScore(entity);
    }

    // Adicionar metadados
    if (options.includeMetadata) {
      marker.metadata = this.extractMetadata(entity, type);
    }

    return marker;
  }

  /**
   * Projeta múltiplas entidades
   */
  projectEntities(
    entities: MappableEntity[],
    type: MapEntityType,
    options: ProjectionOptions = {}
  ): MapMarker[] {
    return entities
      .map((entity) => this.projectEntity(entity, type, options))
      .filter((marker): marker is MapMarker => marker !== null);
  }

  /**
   * Projeta business para MapMarker
   */
  projectBusiness(business: MappableEntity, options: ProjectionOptions = {}): MapMarker | null {
    return this.projectEntity(business, 'business', {
      ...options,
      baseUrl: options.baseUrl || buildAppModulePath(APP_MODULE_SLUGS.business),
    });
  }

  /**
   * Projeta service para MapMarker
   */
  projectService(service: MappableEntity, options: ProjectionOptions = {}): MapMarker | null {
    return this.projectEntity(service, 'service', {
      ...options,
      baseUrl: options.baseUrl || buildAppModulePath(APP_MODULE_SLUGS.services),
    });
  }

  /**
   * Projeta classified para MapMarker
   */
  projectClassified(
    classified: MappableEntity,
    options: ProjectionOptions = {}
  ): MapMarker | null {
    return this.projectEntity(classified, 'classified', {
      ...options,
      baseUrl: options.baseUrl || buildAppModulePath(APP_MODULE_SLUGS.classifieds),
    });
  }

  /**
   * Projeta event para MapMarker
   */
  projectEvent(event: MappableEntity, options: ProjectionOptions = {}): MapMarker | null {
    return this.projectEntity(event, 'event', {
      ...options,
      baseUrl: options.baseUrl || buildAppModulePath(APP_MODULE_SLUGS.events),
    });
  }

  /**
   * Projeta alert para MapMarker
   */
  projectAlert(alert: MappableEntity, options: ProjectionOptions = {}): MapMarker | null {
    return this.projectEntity(alert, 'alert', {
      ...options,
      baseUrl: options.baseUrl || buildAppModulePath(APP_MODULE_SLUGS.communityAlerts),
    });
  }

  /**
   * Projeta professional para MapMarker
   */
  projectProfessional(
    professional: MappableEntity,
    options: ProjectionOptions = {}
  ): MapMarker | null {
    const publicUrl = ProfessionalUrlService.getCanonicalUrlFromTarget({
      id: professional.id,
      profile_id: typeof professional.profile_id === 'string' ? professional.profile_id : null,
      slug: typeof professional.slug === 'string' ? professional.slug : null,
      geographic_path:
        typeof professional.geographic_path === 'string' ? professional.geographic_path : null,
      geographicPath:
        typeof professional.geographicPath === 'string' ? professional.geographicPath : null,
      state: typeof professional.state === 'string' ? professional.state : null,
      city: typeof professional.city === 'string' ? professional.city : null,
    });

    return this.projectEntity(
      publicUrl ? { ...professional, url: publicUrl } : professional,
      'professional',
      options,
    );
  }

  /**
   * Projeta tourist point para MapMarker
   */
  projectTouristPoint(
    point: MappableEntity,
    options: ProjectionOptions = {}
  ): MapMarker | null {
    return this.projectEntity(point, 'tourist_point', {
      ...options,
      baseUrl: options.baseUrl || LAUNCH_URLS.touristPoints,
    });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Extrai coordenadas válidas de uma entidade
   */
  private extractCoordinates(entity: MappableEntity): Coordinates | null {
    // Tentar extrair de campos diretos
    if (entity.latitude != null && entity.longitude != null) {
      const coords = {
        latitude: Number(entity.latitude),
        longitude: Number(entity.longitude),
      };
      return isValidCoordinates(coords) ? coords : null;
    }

    // Tentar extrair de address
    if (entity.address && typeof entity.address === 'object') {
      const addr = entity.address as Record<string, unknown>;
      if (addr.latitude != null && addr.longitude != null) {
        const coords = {
          latitude: Number(addr.latitude),
          longitude: Number(addr.longitude),
        };
        return isValidCoordinates(coords) ? coords : null;
      }
    }

    // Tentar extrair de location
    if (entity.location && typeof entity.location === 'object') {
      const loc = entity.location as Record<string, unknown>;
      if (loc.latitude != null && loc.longitude != null) {
        const coords = {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
        };
        return isValidCoordinates(coords) ? coords : null;
      }
    }

    return null;
  }

  /**
   * Normaliza status para MapEntityStatus
   */
  private normalizeStatus(status?: string): MapEntityStatus {
    if (!status) return 'active';

    const normalized = status.toLowerCase();
    if (normalized === 'active' || normalized === 'ativo') return 'active';
    if (normalized === 'inactive' || normalized === 'inativo') return 'inactive';
    if (normalized === 'pending' || normalized === 'pendente') return 'pending';
    if (normalized === 'expired' || normalized === 'expirado') return 'expired';

    return 'active';
  }

  /**
   * Calcula score de relevância
   */
  private calculateScore(entity: MappableEntity): number {
    let score = 0;

    // Premium tem score maior
    if (entity.is_premium || entity.isPremium) {
      score += 100;
    }

    // Verificado tem score maior
    if (entity.is_verified || entity.isVerified) {
      score += 50;
    }

    // Rating/avaliação
    if (entity.rating && typeof entity.rating === 'number') {
      score += entity.rating * 10;
    }

    // Número de reviews
    if (entity.review_count && typeof entity.review_count === 'number') {
      score += Math.min(entity.review_count, 50);
    }

    // Recência (se tiver created_at)
    if (entity.created_at && typeof entity.created_at === 'string') {
      const daysOld = (Date.now() - new Date(entity.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 30) {
        score += 20;
      }
    }

    return score;
  }

  /**
   * Extrai metadados relevantes
   */
  private extractMetadata(entity: MappableEntity, type: MapEntityType): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      entityType: type,
    };

    if (entity.category !== undefined) metadata.category = entity.category;
    if (entity.subcategory !== undefined) metadata.subcategory = entity.subcategory;
    if (entity.tags !== undefined) metadata.tags = entity.tags;
    if (entity.phone !== undefined) metadata.phone = entity.phone;
    if (entity.whatsapp !== undefined) metadata.whatsapp = entity.whatsapp;
    if (entity.email !== undefined) metadata.email = entity.email;
    if (entity.website !== undefined) metadata.website = entity.website;
    if (entity.rating !== undefined) metadata.rating = entity.rating;
    if (entity.review_count !== undefined) metadata.review_count = entity.review_count;
    if (entity.is_verified !== undefined) metadata.is_verified = entity.is_verified;
    if (entity.is_premium !== undefined) metadata.is_premium = entity.is_premium;
    if (entity.created_at !== undefined) metadata.created_at = entity.created_at;
    if (entity.updated_at !== undefined) metadata.updated_at = entity.updated_at;
    if (entity.coordinate_source !== undefined) metadata.coordinate_source = entity.coordinate_source;
    if (entity.map_layer_key !== undefined) metadata.map_layer_key = entity.map_layer_key;

    // Campos específicos por tipo
    if (type === 'event') {
      if (entity.start_date) metadata.start_date = entity.start_date;
      if (entity.end_date) metadata.end_date = entity.end_date;
    }

    if (type === 'classified') {
      if (entity.price) metadata.price = entity.price;
      if (entity.condition) metadata.condition = entity.condition;
    }

    return metadata;
  }
}

/**
 * Instância singleton do serviço
 */
export const mapEntityProjection = new MapEntityProjectionService();
