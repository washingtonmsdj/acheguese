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
// ROUTING TYPES - TRANSITIONAL COMPATIBILITY
// ============================================

/**
 * @deprecated Use '@/core/routing/types' instead
 * SSOT de routing agora está em core/routing
 * Estes exports são apenas para compatibilidade durante transição
 */
export type {
  TransportProfile,
  RoutingOptions,
  RouteRequest,
  RouteLeg,
  RouteStep,
  Route,
  RouteResponse,
  ETARequest,
  ETAResponse,
  DistanceMatrixRequest,
  DistanceMatrixElement,
  DistanceMatrixResponse,
  RoutingProvider,
} from '@/core/routing/types';

export { formatDuration, formatDistance } from '@/core/routing/services/formatters';

// ============================================
// ROUTING TYPES RE-EXPORTED DURING MAPS/ROUTING CONSOLIDATION
// ============================================

/**
 * @deprecated These types will be moved to core/routing in future versions
 * Do not use for new development
 */
export type {
  IsochroneRequest,
  IsochronePolygon,
  IsochroneResponse,
  MapMatchingRequest,
  MatchedPoint,
  MapMatchingResponse,
  TripPoint,
  Trip,
  CoverageAreaType,
  CircleCoverageArea,
  PolygonCoverageArea,
  TerritoryCoverageArea,
  CoverageArea,
} from './routing';

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

