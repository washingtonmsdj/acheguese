// @ts-nocheck
/**
 * Territorial Mutations - SSOT v2.0
 * 
 * Funções de escrita para gestão territorial
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type { VisibilityFlag } from './types';

/**
 * Atualizar flag de metadata em location ou group
 * 
 * ✅ SEGURANÇA: Usa edge functions para operações com service_role
 * - territorial-update-location-visibility para locations
 * - territorial-update-group-visibility para territorial_groups
 */
export async function updateMetadataFlag(
  table: 'locations' | 'territorial_groups',
  id: string,
  flag: VisibilityFlag,
  value: boolean
): Promise<any> {
  try {
    const functionName = table === 'locations' 
      ? 'territorial-update-location-visibility'
      : 'territorial-update-group-visibility';

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { id, flag, value },
    });

    if (error) {
      logger.error(`territorial.mutations.updateMetadataFlag - ${table}`, error);
      throw new Error(error.message);
    }

    logger.info(`territorial.mutations.updateMetadataFlag`, {
      table,
      id,
      flag,
      value,
    });

    return data;
  } catch (error) {
    logger.error('territorial.mutations.updateMetadataFlag', error);
    throw error;
  }
}

/**
 * Ativar/desativar location com lógica de cascata
 * 
 * Regras:
 * - Ao ATIVAR: ativa todos os pais em cascata
 * - Ao DESATIVAR: desativa todos os filhos (locations e groups) em cascata
 * 
 * ✅ SEGURANÇA: Usa edge function territorial-update-location-visibility
 * - Validação de role admin no servidor
 * - Lógica de cascata implementada no servidor
 * - Audit logging automático
 */
export async function toggleLocationSelector(locationId: string, newValue: boolean): Promise<void> {
  try {
    logger.info('territorial.mutations.toggleLocationSelector', {
      locationId,
      newValue,
    });

    // A edge function já implementa toda a lógica de cascata
    await updateMetadataFlag('locations', locationId, 'is_selector_active', newValue);

    logger.info('territorial.mutations.toggleLocationSelector - Concluído');
  } catch (error) {
    logger.error('territorial.mutations.toggleLocationSelector', error);
    throw error;
  }
}

/**
 * Ativar/desativar group com lógica de cascata
 * 
 * Regras:
 * - Ao ATIVAR: ativa a cidade âncora e todos os seus pais em cascata
 * 
 * ✅ SEGURANÇA: Usa edge function territorial-update-group-visibility
 * - Validação de role admin no servidor
 * - Lógica de cascata implementada no servidor
 * - Audit logging automático
 */
export async function toggleGroupSelector(groupId: string, newValue: boolean): Promise<void> {
  try {
    logger.info('territorial.mutations.toggleGroupSelector', {
      groupId,
      newValue,
    });

    // A edge function já implementa toda a lógica de cascata
    await updateMetadataFlag('territorial_groups', groupId, 'is_selector_active', newValue);

    logger.info('territorial.mutations.toggleGroupSelector - Concluído');
  } catch (error) {
    logger.error('territorial.mutations.toggleGroupSelector', error);
    throw error;
  }
}
