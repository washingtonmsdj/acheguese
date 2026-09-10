/**
 * Territorial Queries - SSOT v2.0
 *
 * Funções de leitura para gestão territorial
 */
import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import type { TerritoryNode, TerritoryTreeData } from './types';

interface TerritoryTreeBrokerResponse {
  locations?: TerritoryNode[];
  groups?: TerritoryNode[];
  groupMembers?: Record<string, string[]>;
}

/**
 * Buscar dataset administrativo completo de territórios (locations + groups).
 *
 * A Edge transporta memberships como objeto JSON; o SSOT de domínio expõe Map
 * para os consumidores React.
 */
export async function fetchTerritoryTree(): Promise<TerritoryTreeData> {
  try {
    const { data, error } = await supabase.functions.invoke<TerritoryTreeBrokerResponse>(
      'territorial-get-tree',
    );

    if (error) {
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        'Falha ao consultar a árvore territorial';
      throw new Error(`Erro ao buscar árvore territorial: ${message}`);
    }

    if (!data || !Array.isArray(data.locations) || !Array.isArray(data.groups)) {
      throw new Error('Resposta inválida da edge function territorial-get-tree');
    }

    const memberEntries = Object.entries(data.groupMembers ?? {}).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].every((value) => typeof value === 'string'),
    );

    return {
      locations: data.locations,
      groups: data.groups,
      groupMembers: new Map(memberEntries),
    };
  } catch (error) {
    logger.error('territorial.queries.fetchTerritoryTree', error);
    throw error;
  }
}
