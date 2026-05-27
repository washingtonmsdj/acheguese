/**
 * Maps Types - Barrel Export
 * 
 * Exportação centralizada de todos os tipos do módulo de mapas.
 * 
 * @module core/maps/types
 */

// Core types
export type {
  Coordinates,
  LngLat,
  BoundingBox,
  MapViewport,
  MapEntityType,
  MapEntityStatus,
  MapMarker,
  MapCluster,
  MapLayerKey,
  MapLayerConfig,
  MapLayersState,
  MapFeature,
  MapFeatureCollection,
  MapFilters,
  MapMarkerClickEvent,
  MapViewportChangeEvent,
  MapClickEvent,
  MapState,
  VisibleMapItem,
  GeocodeResult,
  PlaceSuggestion,
  CircleServiceArea,
  PolygonServiceArea,
  TerritoryServiceArea,
  ServiceArea,
} from './core';

export {
  isValidCoordinates,
  isValidBoundingBox,
  coordinatesToLngLat,
  lngLatToCoordinates,
} from './core';

// ============================================
// PROVIDER TYPES
// ============================================

export type {
  TileStyle,
  TileProviderConfig,
  MapTileProvider,
  GeocodingOptions,
  GeocodingProvider,
  DistanceMatrixProvider,
  IsochroneProvider,
  MapMatchingProvider,
  ProviderRegistry,
  ActiveProvidersConfig,
} from './providers';

export {
  ProviderError,
  ProviderNotConfiguredError,
  ProviderNotFoundError,
  ProviderQuotaExceededError,
  ProviderTimeoutError,
} from './providers';

