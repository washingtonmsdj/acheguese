/**
 * RoutingService - SSOT para roteamento
 * 
 * Service transversal para cálculo de rotas, ETA e distâncias.
 * Abstrai provider específico e fornece interface unificada.
 * 
 * @module core/routing/services
 */
import { logger } from '@/shared/utils/logger';
import type {
  RouteRequest,
  RouteResponse,
  ETARequest,
  ETAResponse,
  DistanceMatrixRequest,
  DistanceMatrixResponse,
  RoutingProvider,
  TransportProfile,
  PROFILE_MAPPING,
} from '../types';
import type { Coordinates } from '@/core/maps/types';
/**
 * Configuração do RoutingService
 */
interface RoutingServiceConfig {
  provider: RoutingProvider;
  defaultProfile?: TransportProfile;
}

/**
 * Service SSOT de roteamento
 * 
 * Responsabilidades:
 * - Calcular rotas entre pontos
 * - Calcular ETA (tempo estimado)
 * - Calcular matriz de distâncias
 * - Abstrair provider específico
 * - Validar requisições
 * - Normalizar respostas
 */
export class RoutingService {
  private provider: RoutingProvider;
  private defaultProfile: TransportProfile;

  constructor(config: RoutingServiceConfig) {
    this.provider = config.provider;
    this.defaultProfile = config.defaultProfile || 'car';
  }

  /**
   * Calcular rota entre origem e destino
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    this.validateRouteRequest(request);
    
    try {
      const response = await this.provider.calculateRoute(request);
      return this.normalizeRouteResponse(response);
    } catch (error) {
      logger.error('[RoutingService] Erro ao calcular rota:', error);
      throw new Error('Falha ao calcular rota');
    }
  }

  /**
   * Calcular ETA entre origem e destino
   */
  async calculateETA(request: ETARequest): Promise<ETAResponse> {
    this.validateETARequest(request);
    
    try {
      const response = await this.provider.calculateETA(request);
      return this.normalizeETAResponse(response);
    } catch (error) {
      logger.error('[RoutingService] Erro ao calcular ETA:', error);
      throw new Error('Falha ao calcular ETA');
    }
  }

  /**
   * Calcular ETA simples (apenas coordenadas)
   */
  async calculateSimpleETA(
    origin: Coordinates,
    destination: Coordinates,
    profile?: TransportProfile
  ): Promise<ETAResponse> {
    return this.calculateETA({
      origin,
      destination,
      profile: profile || this.defaultProfile,
    });
  }

  /**
   * Calcular matriz de distâncias
   */
  async calculateDistanceMatrix(
    request: DistanceMatrixRequest
  ): Promise<DistanceMatrixResponse> {
    this.validateDistanceMatrixRequest(request);
    
    if (!this.provider.calculateDistanceMatrix) {
      throw new Error('Provider não suporta matriz de distâncias');
    }

    try {
      const response = await this.provider.calculateDistanceMatrix(request);
      return response;
    } catch (error) {
      logger.error('[RoutingService] Erro ao calcular matriz:', error);
      throw new Error('Falha ao calcular matriz de distâncias');
    }
  }

  /**
   * Verificar se provider está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.provider.validate();
    } catch {
      return false;
    }
  }

  /**
   * Obter perfil padrão
   */
  getDefaultProfile(): TransportProfile {
    return this.defaultProfile;
  }

  /**
   * Definir perfil padrão
   */
  setDefaultProfile(profile: TransportProfile): void {
    this.defaultProfile = profile;
  }

  /**
   * Mapear perfil legado para novo
   */
  mapLegacyProfile(legacyProfile: string): TransportProfile {
    const mapping: Record<string, TransportProfile> = {
      'driving': 'car',
      'walking': 'foot',
      'cycling': 'bicycle',
      'transit': 'car',
    };
    return mapping[legacyProfile] || this.defaultProfile;
  }

  // ============================================
  // VALIDATIONS
  // ============================================

  private validateRouteRequest(request: RouteRequest): void {
    if (!request.origin || !request.destination) {
      throw new Error('Origem e destino são obrigatórios');
    }

    this.validateCoordinates(request.origin);
    this.validateCoordinates(request.destination);

    if (request.waypoints) {
      request.waypoints.forEach((wp) => this.validateCoordinates(wp));
    }

    if (!request.options?.profile) {
      throw new Error('Perfil de transporte é obrigatório');
    }
  }

  private validateETARequest(request: ETARequest): void {
    if (!request.origin || !request.destination) {
      throw new Error('Origem e destino são obrigatórios');
    }

    this.validateCoordinates(request.origin);
    this.validateCoordinates(request.destination);

    if (!request.profile) {
      throw new Error('Perfil de transporte é obrigatório');
    }
  }

  private validateDistanceMatrixRequest(request: DistanceMatrixRequest): void {
    if (!request.origins?.length || !request.destinations?.length) {
      throw new Error('Origens e destinos são obrigatórios');
    }

    request.origins.forEach((origin) => this.validateCoordinates(origin));
    request.destinations.forEach((dest) => this.validateCoordinates(dest));

    if (!request.profile) {
      throw new Error('Perfil de transporte é obrigatório');
    }
  }

  private validateCoordinates(coords: Coordinates): void {
    if (
      typeof coords.latitude !== 'number' ||
      typeof coords.longitude !== 'number'
    ) {
      throw new Error('Coordenadas inválidas');
    }

    if (coords.latitude < -90 || coords.latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90');
    }

    if (coords.longitude < -180 || coords.longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180');
    }
  }

  // ============================================
  // NORMALIZATION
  // ============================================

  private normalizeRouteResponse(response: RouteResponse): RouteResponse {
    // Garantir que primaryRoute existe
    if (!response.primaryRoute && response.routes.length > 0) {
      response.primaryRoute = response.routes[0];
    }

    // Arredondar valores
    response.routes = response.routes.map((route) => ({
      ...route,
      distanceMeters: Math.round(route.distanceMeters),
      durationSeconds: Math.round(route.durationSeconds),
      legs: route.legs.map((leg) => ({
        ...leg,
        distanceMeters: Math.round(leg.distanceMeters),
        durationSeconds: Math.round(leg.durationSeconds),
      })),
    }));

    return response;
  }

  private normalizeETAResponse(response: ETAResponse): ETAResponse {
    return {
      ...response,
      distanceMeters: Math.round(response.distanceMeters),
      durationSeconds: Math.round(response.durationSeconds),
      durationInTrafficSeconds: response.durationInTrafficSeconds
        ? Math.round(response.durationInTrafficSeconds)
        : undefined,
    };
  }
}

/**
 * Factory para criar instância do RoutingService
 */
export function createRoutingService(
  provider: RoutingProvider,
  defaultProfile?: TransportProfile
): RoutingService {
  return new RoutingService({ provider, defaultProfile });
}
