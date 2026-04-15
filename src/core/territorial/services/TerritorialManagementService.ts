/**
 * TerritorialManagementService - Fachada SSOT v2.0
 * 
 * Ponto único de entrada para gestão territorial.
 * Exporta queries, mutations e types organizados.
 * 
 * @example
 * import { fetchTerritoryTree, updateMetadataFlag, toggleLocationSelector } from '@/core/territorial/services/TerritorialManagementService';
 * import type { VisibilityFlag, TerritoryNode, TerritoryTreeData } from '@/core/territorial/services/TerritorialManagementService';
 */

// ============================================================
// QUERIES - Operações de Leitura
// ============================================================
export {
  fetchTerritoryTree,
} from './territorial.queries';

// ============================================================
// MUTATIONS - Operações de Escrita
// ============================================================
export {
  updateMetadataFlag,
  toggleLocationSelector,
  toggleGroupSelector,
} from './territorial.mutations';

// ============================================================
// TYPES
// ============================================================
export type {
  VisibilityFlag,
  TerritoryNode,
  TerritoryTreeData,
} from './types';

// ============================================================
// FACADE UNIFICADA (compatibilidade legada)
// ============================================================
import * as territorialQueries from './territorial.queries';
import * as territorialMutations from './territorial.mutations';

/**
 * TerritorialFacade - Fachada unificada para gestão territorial
 * @deprecated Use funções individuais de territorial.queries ou territorial.mutations
 */
export const TerritorialFacade = {
  queries: territorialQueries,
  mutations: territorialMutations,
} as const;
