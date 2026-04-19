// @ts-nocheck
/**
 * Territorial Queries - SSOT v2.0
 * 
 * Funções de leitura para gestão territorial
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type { TerritoryNode, TerritoryTreeData } from './types';

/**
 * Buscar árvore completa de territórios (locations + groups)
 * 
 * ✅ SEGURANÇA: Usa edge function territorial-get-tree
 * - Validação de role admin no servidor
 * - Cache de 5 minutos
 * - Audit logging automático
 */
export async function fetchTerritoryTree(): Promise<TerritoryTreeData> {
  try {
    const { data, error } = await supabase.functions.invoke('territorial-get-tree');

    if (error) {
      logger.error('territorial.queries.fetchTerritoryTree', error);
      throw new Error(`Erro ao buscar árvore territorial: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado da edge function');
    }

    return data as TerritoryTreeData;
  } catch (error) {
    logger.error('territorial.queries.fetchTerritoryTree', error);
    throw error;
  }
}
