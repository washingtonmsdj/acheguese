/**
 * Location Module
 *
 * SSOT (Single Source of Truth) territorial do produto.
 * Gerencia a hierarquia geográfica canônica e contexto de localização da aplicação.
 *
 * Responsabilidades:
 * - Hierarquia geográfica (country → state → city → district)
 * - Resolução por ID, path, slug
 * - Navegação de árvore (ancestors, descendants, children)
 * - Contexto geográfico do app — único, tipado, sem hardcode
 *
 * @see docs/GEOGRAPHIC_FOUNDATION.md
 */

// ============================================
// PUBLIC CONTRACTS
// ============================================
export type {
  Location,
  LocationType,
  LocationStatus,
  LocationMetadata,
  LocationTree,
  LocationContextValue,
  LocationError,
  ActiveTerritory,
  TerritoryMode,
  TerritoryFilter,
  TerritorialGroup,
  TerritorialGroupMember,
  TerritorialGroupWithMembers,
  GetLocationByIdInput,
  GetLocationByPathInput,
  GetAncestorsInput,
  GetDescendantsInput,
  GetChildrenInput,
  ValidateLocationInput,
  GetLocationOutput,
  GetAncestorsOutput,
  GetDescendantsOutput,
  GetChildrenOutput,
  ValidateLocationOutput,
  GetLocationTreeOutput,
} from './types';

export { LocationErrorCode, LOCATION_PAGINATION } from './types';

export type { ILocationService } from './services/ILocationService';
export type { ILocationContextStore } from './services/ILocationContextStore';
export type { ILocationRepository } from './repositories/ILocationRepository';
export type { ITerritorialGroupRepository } from './repositories/ITerritorialGroupRepository';

export { LocationRepositoryMock } from './repositories/LocationRepositoryMock';
export { LocationRepositorySupabase } from './repositories/LocationRepositorySupabase';
export { createLocationRepository } from './repositories/createLocationRepository';
export { TerritorialGroupRepositoryMock } from './repositories/TerritorialGroupRepositoryMock';
export { createTerritorialGroupRepository } from './repositories/createTerritorialGroupRepository';

export { locationContextStore } from './stores/LocationContextStore';
export { BaseLocationService } from './services/BaseLocationService';
export { TerritorialGroupService } from './services/TerritorialGroupService';
export { TerritoryModeManager } from './services/TerritoryModeManager'; // SSOT para lógica de modo territorial
export type { MismatchInfo } from './services/TerritoryModeManager';

// ============================================
// PUBLIC HOOKS
// ============================================
export { useActiveTerritory } from './hooks/useActiveTerritory';
export { useLocationContext } from './hooks/useLocationContext';
export { useUserTerritory } from './hooks/useUserTerritory';
export { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from './hooks/useTerritoryFilter';
export { useModuleTerritoryFilter } from './hooks/useModuleTerritoryFilter';
export type {
  ModuleTerritoryFilterResult,
  ModuleTerritorySource,
  ModuleTerritoryUiFilter,
  UseModuleTerritoryFilterOptions,
} from './hooks/useModuleTerritoryFilter';
export { useTerritoryModeInitializer } from './hooks/useTerritoryModeInitializer';
export { useModuleLocation } from './hooks/useModuleLocation'; // Hook genérico SSOT
export { useTerritoryLabels } from './hooks/useTerritoryLabels';
export { useResolvedUserLocation } from './hooks/useResolvedUserLocation';
export type { LocationResolutionStatus, UseResolvedUserLocationReturn } from './hooks/useResolvedUserLocation';

// ============================================
// PUBLIC COMPONENTS
// ============================================
export { TerritoryModeInitializer } from './components/TerritoryModeInitializer';
export { TerritoryIndicator } from './components/TerritoryIndicator';
export { ModuleLocationDialog } from './components/ModuleLocationDialog';

// ============================================
// PUBLIC UTILS
// ============================================
export { applyTerritoryFilter } from './utils';
export { resolveLocationDescendants } from './utils/resolveLocationDescendants';
export {
  extractCityStateFromPath,
  getCityStateFromLocation,
  getCityStateFromGroup,
  getCityStateFromResolved,
  formatCityState,
} from './utils/territoryHelpers';
export { getTerritoryLabels, getCategoryDescription } from './utils/territoryLabels';
export type { TerritoryLabels, TerritoryLevel } from './utils/territoryLabels';
export { resolveLocationDisplay, resolveDistanceLabel } from './utils/entityLocationDisplay';
export type { LocationDisplayContext, LocationDisplayResult } from './utils/entityLocationDisplay';

// ============================================
// ENTITY LOCATION TYPES
// ============================================
export type {
  LocationEntityType,
  LocationSource,
  ResolvedEntityLocation,
  EntityDisplayRules,
} from './types/entityLocation';
export {
  ENTITY_DISPLAY_RULES,
  getDisplayRules,
  canShowFullAddress,
  canShowExactPin,
  getPublicLocationLabel,
} from './types/entityLocation';

// ============================================
// SERVICES
// ============================================
export { userLocationResolver } from './services/UserLocationResolver';
export {
  LocationGeocodingService,
  locationGeocodingService,
} from './services/LocationGeocodingService';
export {
  LocationAdminService,
  locationAdminService,
} from './services/LocationAdminService';
export type {
  AdminLocationRecord,
  CreateAdminLocationInput,
} from './services/LocationAdminService';
export type {
  TerritoryResolution,
  ProviderAddressSnapshot,
  SystemAddressSnapshot,
  LocationGeocodingResult,
  LocationInfoExtraction,
  LocationPostalCodeLookupResult,
  LocationGeocodingServiceDeps,
} from './services/LocationGeocodingService';

// ============================================
// LEGACY EXPORTS
// LocationService: gerencia GPS/histórico/residência — NÃO é territorial.
// Mantido separado da fundação territorial por responsabilidade distinta.
// Candidato a mover para src/core/location-history/ em refactor futuro.
// ============================================
export { locationService, LocationService } from "./services/LocationHistoryService";
export type {
  LocationHistory,
  UserResidence,
  ServiceArea,
  ProfileLocation,
} from "./services/LocationHistoryService";
