/**
 * Territorial Mutations - SSOT v2.0
 *
 * Funções de escrita para gestão territorial.
 */
import { logger } from '@/shared/utils/logger';
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from '@/integrations/supabase';
import type { VisibilityFlag } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Atualizar flag canônica em location ou territorial group.
 *
 * O HTTP 2xx isolado não é suficiente: o Edge precisa devolver a mesma entidade
 * e o metadata precisa refletir exatamente o valor solicitado.
 */
export async function updateMetadataFlag(
  table: 'locations' | 'territorial_groups',
  id: string,
  flag: VisibilityFlag,
  value: boolean,
): Promise<Record<string, unknown>> {
  const functionName =
    table === 'locations'
      ? 'territorial-update-location-visibility'
      : 'territorial-update-group-visibility';
  const entityKey = table === 'locations' ? 'location' : 'group';
  const body =
    table === 'locations'
      ? { id, locationId: id, flag, value }
      : { id, groupId: id, flag, value };

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        'Falha ao atualizar a visibilidade territorial.';
      logger.error(`territorial.mutations.updateMetadataFlag - ${table}`, {
        message,
      });
      throw new Error(message);
    }

    if (!isRecord(data) || data.success !== true) {
      throw new Error('Resposta invalida ao atualizar a visibilidade territorial.');
    }

    const entity = isRecord(data[entityKey]) ? data[entityKey] : null;
    const metadata = entity && isRecord(entity.metadata) ? entity.metadata : null;
    if (!entity || entity.id !== id || !metadata || metadata[flag] !== value) {
      throw new Error('Resposta invalida ao atualizar a visibilidade territorial.');
    }

    logger.info('territorial.mutations.updateMetadataFlag', {
      table,
      id,
      flag,
      value,
    });

    return entity;
  } catch (error) {
    logger.error('territorial.mutations.updateMetadataFlag', error);
    throw error;
  }
}

/**
 * Ativar/desativar location. Regras de cascata pertencem ao broker territorial;
 * o cliente apenas exige confirmação autoritativa do nó solicitado.
 */
export async function toggleLocationSelector(
  locationId: string,
  newValue: boolean,
): Promise<void> {
  await updateMetadataFlag(
    'locations',
    locationId,
    'is_selector_active',
    newValue,
  );
}

/**
 * Ativar/desativar territorial group. Regras de cascata pertencem ao broker;
 * o cliente apenas exige confirmação autoritativa do grupo solicitado.
 */
export async function toggleGroupSelector(
  groupId: string,
  newValue: boolean,
): Promise<void> {
  await updateMetadataFlag(
    'territorial_groups',
    groupId,
    'is_selector_active',
    newValue,
  );
}
