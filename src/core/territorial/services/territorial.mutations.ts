/**
 * Territorial Mutations - SSOT v2.0
 * 
 * Funções de escrita para gestão territorial
 */

import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { logger } from '@/shared/utils/logger';
import type { VisibilityFlag } from './types';

/**
 * Atualizar flag de metadata em location ou group
 */
export async function updateMetadataFlag(
  table: 'locations' | 'territorial_groups',
  id: string,
  flag: VisibilityFlag,
  value: boolean
): Promise<any> {
  try {
    const { data: current, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error(`territorial.mutations.updateMetadataFlag - fetch ${table}`, fetchError);
      throw new Error(fetchError.message);
    }

    const updatedMetadata = {
      ...(current?.metadata || {}),
      [flag]: value,
    };

    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ metadata: updatedMetadata })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`territorial.mutations.updateMetadataFlag - update ${table}`, error);
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
 */
export async function toggleLocationSelector(locationId: string, newValue: boolean): Promise<void> {
  try {
    logger.info('territorial.mutations.toggleLocationSelector', {
      locationId,
      newValue,
    });

    // Buscar location atual
    const { data: location, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (fetchError) {
      logger.error('territorial.mutations.toggleLocationSelector - fetch', fetchError);
      throw new Error(fetchError.message);
    }

    // Se está ATIVANDO, ativar todos os pais primeiro
    if (newValue === true && location.parent_id) {
      logger.info('territorial.mutations - Ativando pais em cascata');

      const parents: any[] = [];
      let currentParentId = location.parent_id;

      while (currentParentId) {
        const { data: parent } = await supabaseAdmin
          .from('locations')
          .select('*')
          .eq('id', currentParentId)
          .single();

        if (parent) {
          parents.push(parent);
          currentParentId = parent.parent_id;
        } else {
          break;
        }
      }

      // Ativar todos os pais que estão inativos
      for (const parent of parents) {
        if (parent.metadata?.is_selector_active !== true) {
          logger.info(`territorial.mutations - Ativando pai: ${parent.name}`);
          await updateMetadataFlag('locations', parent.id, 'is_selector_active', true);
        }
      }
    }

    // Atualizar a localização atual
    await updateMetadataFlag('locations', locationId, 'is_selector_active', newValue);

    // Se está DESATIVANDO, desativar todos os filhos
    if (newValue === false) {
      logger.info('territorial.mutations - Desativando filhos em cascata');

      // Buscar todos os filhos (localizações)
      const { data: children } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('parent_id', locationId);

      if (children && children.length > 0) {
        for (const child of children) {
          if (child.metadata?.is_selector_active === true) {
            logger.info(`territorial.mutations - Desativando filho: ${child.name}`);
            await updateMetadataFlag('locations', child.id, 'is_selector_active', false);
          }
        }
      }

      // Buscar grupos que têm esta localização como anchor_city
      const { data: groups } = await supabaseAdmin
        .from('territorial_groups')
        .select('*')
        .eq('anchor_city_id', locationId);

      if (groups && groups.length > 0) {
        for (const group of groups) {
          if (group.metadata?.is_selector_active === true) {
            logger.info(`territorial.mutations - Desativando grupo: ${group.name}`);
            await updateMetadataFlag('territorial_groups', group.id, 'is_selector_active', false);
          }
        }
      }
    }

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
 */
export async function toggleGroupSelector(groupId: string, newValue: boolean): Promise<void> {
  try {
    logger.info('territorial.mutations.toggleGroupSelector', {
      groupId,
      newValue,
    });

    // Buscar group atual
    const { data: group, error: fetchError } = await supabaseAdmin
      .from('territorial_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (fetchError) {
      logger.error('territorial.mutations.toggleGroupSelector - fetch', fetchError);
      throw new Error(fetchError.message);
    }

    // Se está ATIVANDO, ativar a cidade âncora e seus pais
    if (newValue === true && group.anchor_city_id) {
      logger.info('territorial.mutations - Ativando cidade âncora e pais');

      // Buscar cidade âncora
      const { data: anchorCity } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', group.anchor_city_id)
        .single();

      if (anchorCity) {
        // Ativar cidade se estiver inativa
        if (anchorCity.metadata?.is_selector_active !== true) {
          logger.info(`territorial.mutations - Ativando cidade âncora: ${anchorCity.name}`);
          await updateMetadataFlag('locations', anchorCity.id, 'is_selector_active', true);
        }

        // Ativar pais da cidade
        let currentParentId = anchorCity.parent_id;
        while (currentParentId) {
          const { data: parent } = await supabaseAdmin
            .from('locations')
            .select('*')
            .eq('id', currentParentId)
            .single();

          if (parent) {
            if (parent.metadata?.is_selector_active !== true) {
              logger.info(`territorial.mutations - Ativando pai: ${parent.name}`);
              await updateMetadataFlag('locations', parent.id, 'is_selector_active', true);
            }
            currentParentId = parent.parent_id;
          } else {
            break;
          }
        }
      }
    }

    // Atualizar o grupo atual
    await updateMetadataFlag('territorial_groups', groupId, 'is_selector_active', newValue);

    logger.info('territorial.mutations.toggleGroupSelector - Concluído');
  } catch (error) {
    logger.error('territorial.mutations.toggleGroupSelector', error);
    throw error;
  }
}
