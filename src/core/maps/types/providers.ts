/**
 * Provider Contracts - Interfaces para providers de mapa
 * 
 * Contratos estáveis e substituíveis para integração com providers externos.
 * Nenhum provider específico deve vazar para o domínio.
 * 
 * @module core/maps/types/providers
 */

import type {
  Coordinates,
  BoundingBox,
  GeocodeResult,
  PlaceSuggestion,
} from './core';

import type {
  RouteRequest,
  RouteResponse,
  ETARequest,
  ETAResponse,
  DistanceMatrixRequest,
  DistanceMatrixResponse,
  RoutingProvider,
} from '@/core/routing/types';

import type {
  IsochroneRequest,
  IsochroneResponse,
  MapMatchingRequest,
  MapMatchingResponse,
} from './routing';

// ============================================
// MAP TILE PROVIDER
// ============================================

/**
 * Estilo de tiles do mapa
 */
export type TileStyle = 'streets' | 'satellite' | 'hybrid' | 'terrain' | 'dark' | 'light';

/**
 * Configuração de provider de tiles
 */
export interface TileProviderConfig {
  /** Nome do provider */
  name: string;
  /** URL do estilo (MapLibre style spec) */
  styleUrl: string;
  /** API key (se necessário) */
  apiKey?: string;
  /** Atribuição */
  attribution?: string;
  /** Configurações adicionais */
  options?: Record<string, unknown>;
}

/**
 * Interface de provider de tiles
 */
export interface MapTileProvider {
  /**
   * Retorna a configuração de tiles para um estilo
   */
  getTileConfig(style: TileStyle): TileProviderConfig;

  /**
   * Retorna os estilos disponíveis
   */
  getAvailableStyles(): TileStyle[];

  /**
   * Valida se o provider está configurado corretamente
   */
  validate(): Promise<boolean>;
}

// ============================================
// GEOCODING PROVIDER
// ============================================

/**
 * Opções de geocoding
 */
export interface GeocodingOptions {
  /** Limitar busca a um país (código ISO) */
  country?: string;
  /** Limitar busca a uma região */
  region?: string;
  /** Bias para coordenadas próximas */
  proximity?: Coordinates;
  /** Bounding box para limitar resultados */
  bounds?: BoundingBox;
  /** Número máximo de resultados */
  limit?: number;
  /** Idioma dos resultados */
  language?: string;
}

/**
 * Interface de provider de geocoding
 */
export interface GeocodingProvider {
  /**
   * Geocoding: endereço → coordenadas
   */
  geocode(address: string, options?: GeocodingOptions): Promise<GeocodeResult[]>;

  /**
   * Reverse geocoding: coordenadas → endereço
   */
  reverseGeocode(coordinates: Coordinates, options?: GeocodingOptions): Promise<GeocodeResult[]>;

  /**
   * Autocomplete de lugares
   */
  searchPlaces(query: string, options?: GeocodingOptions): Promise<PlaceSuggestion[]>;

  /**
   * Obter detalhes completos de uma sugestão
   */
  getPlaceDetails(placeId: string): Promise<GeocodeResult>;
}

// ============================================
// ROUTING PROVIDER
// ============================================

/**
 * Interface de provider de roteamento
 */
export interface RoutingProvider {
  /**
   * Calcular rota entre pontos
   */
  calculateRoute(request: RouteRequest): Promise<RouteResponse>;

  /**
   * Calcular ETA (Estimated Time of Arrival)
   */
  calculateETA(request: ETARequest): Promise<ETAResponse>;

  /**
   * Validar se o provider está configurado
   */
  validate(): Promise<boolean>;
}

// ============================================
// DISTANCE MATRIX PROVIDER
// ============================================

/**
 * Interface de provider de matriz de distâncias
 */
export interface DistanceMatrixProvider {
  /**
   * Calcular matriz de distâncias
   */
  calculateMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrixResponse>;

  /**
   * Validar se o provider está configurado
   */
  validate(): Promise<boolean>;
}

// ============================================
// ISOCHRONE PROVIDER
// ============================================

/**
 * Interface de provider de isócronas
 */
export interface IsochroneProvider {
  /**
   * Calcular isócronas (áreas de alcance)
   */
  calculateIsochrone(request: IsochroneRequest): Promise<IsochroneResponse>;

  /**
   * Validar se o provider está configurado
   */
  validate(): Promise<boolean>;
}

// ============================================
// MAP MATCHING PROVIDER
// ============================================

/**
 * Interface de provider de map matching
 */
export interface MapMatchingProvider {
  /**
   * Ajustar trajeto GPS às vias
   */
  matchRoute(request: MapMatchingRequest): Promise<MapMatchingResponse>;

  /**
   * Validar se o provider está configurado
   */
  validate(): Promise<boolean>;
}

// ============================================
// PROVIDER REGISTRY
// ============================================

/**
 * Registro de providers disponíveis
 */
export interface ProviderRegistry {
  tiles: Record<string, MapTileProvider>;
  geocoding: Record<string, GeocodingProvider>;
  routing: Record<string, RoutingProvider>;
  distanceMatrix: Record<string, DistanceMatrixProvider>;
  isochrone: Record<string, IsochroneProvider>;
  mapMatching: Record<string, MapMatchingProvider>;
}

/**
 * Configuração de providers ativos
 */
export interface ActiveProvidersConfig {
  tiles: string;
  geocoding: string;
  routing: string;
  distanceMatrix?: string;
  isochrone?: string;
  mapMatching?: string;
}

// ============================================
// PROVIDER ERRORS
// ============================================

/**
 * Erro de provider
 */
export class ProviderError extends Error {
  constructor(
    public providerName: string,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(`[${providerName}] ${message}`);
    this.name = 'ProviderError';
  }
}

/**
 * Erro de provider não configurado
 */
export class ProviderNotConfiguredError extends ProviderError {
  constructor(providerName: string, providerType: string) {
    super(
      providerName,
      'NOT_CONFIGURED',
      `Provider ${providerType} '${providerName}' is not configured`
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Erro de provider não encontrado
 */
export class ProviderNotFoundError extends ProviderError {
  constructor(providerName: string, providerType: string) {
    super(
      providerName,
      'NOT_FOUND',
      `Provider ${providerType} '${providerName}' not found in registry`
    );
    this.name = 'ProviderNotFoundError';
  }
}

/**
 * Erro de quota excedida
 */
export class ProviderQuotaExceededError extends ProviderError {
  constructor(providerName: string) {
    super(providerName, 'QUOTA_EXCEEDED', `API quota exceeded for provider '${providerName}'`);
    this.name = 'ProviderQuotaExceededError';
  }
}

/**
 * Erro de timeout
 */
export class ProviderTimeoutError extends ProviderError {
  constructor(providerName: string, timeoutMs: number) {
    super(
      providerName,
      'TIMEOUT',
      `Request to provider '${providerName}' timed out after ${timeoutMs}ms`
    );
    this.name = 'ProviderTimeoutError';
  }
}
