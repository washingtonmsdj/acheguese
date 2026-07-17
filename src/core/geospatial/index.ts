/**
 * Core Geospatial Module
 * 
 * Operações geoespaciais com PostGIS.
 * 
 * Owns spatial search, boundaries and coordinate calculations. Entity
 * coverage belongs to core/coverage and must not be implemented here.
 */

// Types
export * from './types';

// Services
export { GeospatialService } from './services/GeospatialService';
export { SpatialSearchService } from './services/SpatialSearchService';
export type {
  EntityType,
  BoundingBox,
  SpatialSearchResult,
  SearchByRadiusInput,
  SearchByBoundsInput,
  SearchHybridInput,
} from './services/SpatialSearchService';
export { boundaryService, BoundaryServiceClass } from './services/BoundaryService';
export type { BoundsResult, CityBoundsInput, NeighborhoodBoundsInput } from './services/BoundaryService';

// Service Instances
export { geospatialService } from './services/GeospatialService';
export { spatialSearchService } from './services/SpatialSearchService';

// Hooks
export * from './hooks/useSpatialSearch';

// Components
export { DistanceBadge } from './components/DistanceBadge';
export { NearbyToggle } from './components/NearbyToggle';

// Repositories
export * from './repositories/IGeospatialRepository';
export * from './repositories/createGeospatialRepository';
