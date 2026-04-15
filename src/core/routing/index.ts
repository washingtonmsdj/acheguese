/**
 * Core Routing Module - SSOT para roteamento
 * 
 * Módulo transversal para cálculo de rotas, ETA e distâncias.
 * Usado por maps, mobility e qualquer módulo que precise de routing.
 * 
 * @module core/routing
 */

// ============================================
// TYPES
// ============================================
export type * from './types';

// ============================================
// SERVICES
// ============================================
export { RoutingService, createRoutingService } from './services/RoutingService';
export { formatDistance, formatDuration, formatSpeed, calculateAverageSpeed } from './services/formatters';

// ============================================
// INSTANCE
// ============================================
export { routingService, reconfigureRoutingProvider } from './instance';

// ============================================
// HOOKS
// ============================================
export { useRouting } from './hooks/useRouting';

// Re-export hooks de navegação existentes
export {
  useAppUrls,
  useFriendlyModuleUrls,
  useModuleUrls,
  useResolveTerritoryFromUrl,
} from './hooks';

export type {
  AppUrls,
  FriendlyModuleUrls,
  ModuleUrls,
  TerritoryResolveResult,
  ResolvedTerritory,
} from './hooks';
