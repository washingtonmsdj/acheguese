/**
 * Routing Hooks - Exports centralizados
 * 
 * SSOT para navegação e URLs da aplicação.
 */

export { useAppUrls } from './useAppUrls';
export { useFriendlyModuleUrls } from './useFriendlyModuleUrls';
export { useModuleUrls } from './useModuleUrls';
export { useResolveTerritoryFromUrl } from './useResolveTerritoryFromUrl';
export { useRouting } from './useRouting';

export type { AppUrls } from './useAppUrls';
export type { FriendlyModuleUrls } from './useFriendlyModuleUrls';
export type { ModuleUrls } from './useModuleUrls';
export type { TerritoryResolveResult, ResolvedTerritory } from './useResolveTerritoryFromUrl';

