/**
 * TerritorialManagementService - SSOT administrativo territorial.
 *
 * Ponto unico de entrada para leitura e escrita da arvore territorial.
 * Hooks e paginas administrativas devem consumir esta classe ou os exports
 * diretos de queries/mutations abaixo, sem aliases paralelos.
 */

export {
  fetchTerritoryTree,
} from './territorial.queries';

export {
  updateMetadataFlag,
  toggleLocationSelector,
  toggleGroupSelector,
} from './territorial.mutations';

export type {
  VisibilityFlag,
  TerritoryNode,
  TerritoryTreeData,
} from './types';

import { fetchTerritoryTree as fetchTerritoryTreeFn } from './territorial.queries';
import {
  updateMetadataFlag as updateMetadataFlagFn,
  toggleLocationSelector as toggleLocationSelectorFn,
  toggleGroupSelector as toggleGroupSelectorFn,
} from './territorial.mutations';
import type { VisibilityFlag } from './types';

export class TerritorialManagementService {
  static async fetchTerritoryTree() {
    return fetchTerritoryTreeFn();
  }

  static async updateMetadataFlag(
    entity: 'locations' | 'territorial_groups',
    id: string,
    flag: VisibilityFlag,
    value: boolean,
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
