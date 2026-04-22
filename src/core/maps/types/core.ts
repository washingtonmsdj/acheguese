/**
 * Core Map Types - Fundação Geográfica
 * 
 * Tipos fundamentais para o sistema de mapas, independentes de provider.
 * Todos os tipos aqui devem ser agnósticos de implementação (MapLibre, Google, etc).
 * 
 * @module core/maps/types/core
 */

// ============================================
// COORDINATES & GEOMETRY
// ============================================

/**
 * Coordenadas geográficas WGS84 (EPSG:4326)
 * Padrão: latitude primeiro (convenção geográfica)
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Coordenadas no formato [lng, lat] (convenção GeoJSON/MapLibre)
 */
export type LngLat = [number, number];

/**
 * Bounding box geográfica [west, south, east, north]
 */
export type BoundingBox = [number, number, number, number];

/**
 * Viewport do mapa - estado visual da câmera
 */
export interface MapViewport {
  center: Coordinates;
  zoom: number;
  bearing?: number;
  pitch?: number;
  bounds?: BoundingBox;
}

// ============================================
// MAP ENTITIES
// ============================================

/**
 * Tipos de entidades que podem ser exibidas no mapa
 */
export type MapEntityType =
  | 'business'
  | 'service'
  | 'classified'
  | 'event'
  | 'alert'
  | 'professional'
  | 'tourist_point'
  | 'driver'
  | 'ride'
  | 'user_location';

/**
 * Status de uma entidade no mapa
 */
export type MapEntityStatus = 'active' | 'inactive' | 'pending' | 'expired';

/**
 * Marcador genérico no mapa
 * Representa qualquer entidade posicionável
 */
export interface MapMarker {
  id: string;
  type: MapEntityType;
  coordinates: Coordinates;
  title: string;
  subtitle?: string;
  status: MapEntityStatus;
  /** URL pública da entidade */
  url?: string;
  /** Dados adicionais específicos do tipo */
  metadata?: Record<string, unknown>;
  /** Score/relevância para ordenação */
  score?: number;
  /** Indica se é premium/destacado */
  isPremium?: boolean;
}

/**
 * Cluster de marcadores
 */
export interface MapCluster {
  id: string;
  coordinates: Coordinates;
  count: number;
  /** IDs dos marcadores no cluster */
  markerIds: string[];
  /** Bounding box do cluster */
  bounds: BoundingBox;
}

// ============================================
// MAP LAYERS
// ============================================

/**
 * Chaves de camadas disponíveis no mapa
 */
export type MapLayerKey =
  | 'businesses'
  | 'gastronomy'
  | 'services'
  | 'classifieds'
  | 'events'
  | 'alerts'
  | 'professionals'
  | 'tourist_points'
  | 'mobility'
  | 'user_location'
  | 'service_areas'
  | 'boundaries';

/**
 * Configuração de uma camada do mapa
 */
export interface MapLayerConfig {
  key: MapLayerKey;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  visible: boolean;
  minZoom?: number;
  maxZoom?: number;
  /** Indica se a camada suporta clustering */
  supportsClustering?: boolean;
}

/**
 * Estado de visibilidade das camadas
 */
export type MapLayersState = Record<MapLayerKey, boolean>;

// ============================================
// MAP FEATURES
// ============================================

/**
 * Feature GeoJSON genérica
 */
export interface MapFeature<T = unknown> {
  type: 'Feature';
  id: string | number;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: T;
}

/**
 * Coleção de features GeoJSON
 */
export interface MapFeatureCollection<T = unknown> {
  type: 'FeatureCollection';
  features: MapFeature<T>[];
}

// ============================================
// MAP FILTERS
// ============================================

/**
 * Filtros aplicáveis ao mapa
 */
export interface MapFilters {
  /** Camadas visíveis */
  layers: MapLayersState;
  /** Tipos de entidades */
  entityTypes?: MapEntityType[];
  /** Status das entidades */
  status?: MapEntityStatus[];
  /** Apenas premium */
  premiumOnly?: boolean;
  /** Busca textual */
  searchQuery?: string;
  /** Raio em metros (para "perto de mim") */
  radiusMeters?: number;
  /** Filtros customizados por tipo */
  custom?: Record<string, unknown>;
}

// ============================================
// MAP INTERACTIONS
// ============================================

/**
 * Evento de clique em marcador
 */
export interface MapMarkerClickEvent {
  marker: MapMarker;
  coordinates: Coordinates;
  originalEvent?: MouseEvent;
}

/**
 * Evento de mudança de viewport
 */
export interface MapViewportChangeEvent {
  viewport: MapViewport;
  /** Indica se foi mudança por interação do usuário */
  userInitiated: boolean;
}

/**
 * Evento de clique no mapa
 */
export interface MapClickEvent {
  coordinates: Coordinates;
  features?: MapFeature[];
  originalEvent?: MouseEvent;
}

// ============================================
// MAP STATE
// ============================================

/**
 * Estado completo do mapa (serializável para URL)
 */
export interface MapState {
  viewport: MapViewport;
  filters: MapFilters;
  selectedMarkerId?: string;
  /** Modo de visualização */
  viewMode?: 'map' | 'list' | 'split';
}

/**
 * Item visível no mapa (para sincronização com lista)
 */
export interface VisibleMapItem {
  id: string;
  type: MapEntityType;
  marker: MapMarker;
  /** Indica se está dentro do viewport atual */
  inViewport: boolean;
  /** Distância do centro em metros */
  distanceFromCenter?: number;
}

// ============================================
// SEARCH & GEOCODING
// ============================================

/**
 * Resultado de busca geográfica
 */
export interface GeocodeResult {
  id: string;
  name: string;
  displayName: string;
  coordinates: Coordinates;
  bounds?: BoundingBox;
  type: 'address' | 'poi' | 'city' | 'district' | 'state' | 'country';
  /** Confiança do resultado (0-1) */
  confidence: number;
  /** Dados adicionais do provider */
  metadata?: Record<string, unknown>;
}

/**
 * Sugestão de lugar (autocomplete)
 */
export interface PlaceSuggestion {
  id: string;
  text: string;
  description?: string;
  type: 'address' | 'poi' | 'location';
  coordinates?: Coordinates;
  /** Dados necessários para geocoding completo */
  context?: Record<string, unknown>;
}

// ============================================
// SERVICE AREAS
// ============================================

/**
 * Área de serviço circular
 */
export interface CircleServiceArea {
  type: 'circle';
  center: Coordinates;
  radiusMeters: number;
}

/**
 * Área de serviço poligonal
 */
export interface PolygonServiceArea {
  type: 'polygon';
  coordinates: Coordinates[];
}

/**
 * Área de serviço por territórios
 */
export interface TerritoryServiceArea {
  type: 'territory';
  locationIds: string[];
}

/**
 * União de tipos de área de serviço
 */
export type ServiceArea = CircleServiceArea | PolygonServiceArea | TerritoryServiceArea;

// ============================================
// VALIDATION
// ============================================

/**
 * Valida se coordenadas são válidas
 */
export function isValidCoordinates(coords: Partial<Coordinates>): coords is Coordinates {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Valida se bounding box é válida
 */
export function isValidBoundingBox(bbox: number[]): bbox is BoundingBox {
  return (
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((n) => typeof n === 'number') &&
    bbox[0] < bbox[2] && // west < east
    bbox[1] < bbox[3] // south < north
  );
}

/**
 * Converte Coordinates para LngLat
 */
export function coordinatesToLngLat(coords: Coordinates): LngLat {
  return [coords.longitude, coords.latitude];
}

/**
 * Converte LngLat para Coordinates
 */
export function lngLatToCoordinates(lngLat: LngLat): Coordinates {
  return {
    longitude: lngLat[0],
    latitude: lngLat[1],
  };
}
