/**
 * Core Geospatial Module
 * 
 * Operações geoespaciais com PostGIS.
 * 
 * ETAPA 1 - Novos recursos:
 * - Busca espacial por distância/raio
 * - Sistema de cobertura geográfica
 * - Hooks reutilizáveis
 * - Componentes de UI
 */

// Types
export * from './types';

// Services
export * from './services/GeospatialService';
export * from './services/SpatialSearchService';
export * from './services/CoverageService';
export * from './services/BoundaryService';

// Service Instances
export { geospatialService } from './services/GeospatialService';
export { spatialSearchService } from './services/SpatialSearchService';
export { coverageService } from './services/CoverageService';
export { boundaryService } from './services/BoundaryService';

// Hooks
export * from './hooks/useSpatialSearch';
export * from './hooks/useCoverage';

// Components
export { CoverageBadge } from './components/CoverageBadge';
export { DistanceBadge } from './components/DistanceBadge';
export { NearbyToggle } from './components/NearbyToggle';
export { CoverageSettingsForm } from './components/CoverageSettingsForm';

// Repositories
export * from './repositories/IGeospatialRepository';
export * from './repositories/createGeospatialRepository';
