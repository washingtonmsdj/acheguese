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

// ============================================================
// SERVICE CLASS (para compatibilidade com hooks existentes)
// ============================================================
import { fetchTerritoryTree as fetchTerritoryTreeFn } from './territorial.queries';
import {
  updateMetadataFlag as updateMetadataFlagFn,
  toggleLocationSelector as toggleLocationSelectorFn,
  toggleGroupSelector as toggleGroupSelectorFn,
} from './territorial.mutations';
import type { VisibilityFlag } from './types';

/**
 * TerritorialManagementService - Classe de serviço para gestão territorial
 * 
 * Fornece métodos estáticos para operações de leitura e escrita
 * no sistema territorial.
 */
export class TerritorialManagementService {
  static async fetchTerritoryTree() {
    return fetchTerritoryTreeFn();
  }

  static async updateMetadataFlag(
    entity: 'locations' | 'territorial_groups',
    id: string,
    flag: VisibilityFlag,
    value: boolean
  ) {
    return updateMetadataFlagFn(entity, id, flag, value);
  }

  static async toggleLocationSelector(locationId: string, value: boolean) {
    return toggleLocationSelectorFn(locationId, value);
  }

  static async toggleGroupSelector(groupId: string, value: boolean) {
    return toggleGroupSelectorFn(groupId, value);
  }
}

/**
 * Instância singleton do TerritorialManagementService (para compatibilidade)
 * @deprecated Use a classe TerritorialManagementService diretamente com seus métodos estáticos
 */
export const territorialManagementService = TerritorialManagementService;
