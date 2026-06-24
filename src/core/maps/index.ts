/**
 * Maps Module - Public API
 *
 * SSOT para sistema de mapas do produto.
 *
 * @module core/maps
 */

// ============================================
// TYPES
// ============================================
export type * from './types';

// ============================================
// SERVICES
// ============================================
export { mapEntityProjection } from './services/MapEntityProjectionService';
export { GeolocationService } from './services/GeolocationService';
export { clusteringService } from './services/ClusteringService';
export { GeocodingService, geocodingService } from './services/MapGeocodingAdapter';
export type { GeolocationCoords, GeolocationResult, GeolocationOptions } from './services/GeolocationService';
export type { ClusterPoint, ClusterOptions } from './services/ClusteringService';

// ============================================
// COMPONENTS v3
// ============================================
export {
  MapLibreAdapter,
  MapLayerToggle,
  useViewportBridge,
} from './components/v3';

export type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
  MapLayerToggleProps,
} from './components/v3';

export { MapRadiusControl } from './components/v3/controls/MapRadiusControl';
export type { MapRadiusControlProps } from './components/v3/controls/MapRadiusControl';

// ============================================
// PROVIDERS (SSOT de configuração)
// ============================================
export { DEFAULT_TILE_STYLE, DARK_TILE_STYLE, DEFAULT_CAMERA, NEIGHBORHOOD_COLORS } from './providers/MapProvider';
export { MAP_RUNTIME_LAYER_KEYS, MAP_PRODUCT_SURFACES } from './config/runtimeConfig';
export type { MapProductSurface } from './config/runtimeConfig';

// ============================================
// HOOKS
// ============================================
export { useTerritoryPolygon } from './hooks/useTerritoryPolygon';
export { useMapClustering } from './hooks/useMapClustering';
export type { TerritoryPolygon } from './hooks/useTerritoryPolygon';
export type { UseMapClusteringOptions, UseMapClusteringResult } from './hooks/useMapClustering';
