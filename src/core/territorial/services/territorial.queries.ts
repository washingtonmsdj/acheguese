/**
 * Territorial Queries - SSOT v2.0
 * 
 * Funções de leitura para gestão territorial
 */

import { supabaseAdmin } from '@/integrations/supabase/supabaseAdmin';
import { logger } from '@/shared/utils/logger';
import type { TerritoryNode, TerritoryTreeData } from './types';

/**
 * Buscar árvore completa de territórios (locations + groups)
 */
export async function fetchTerritoryTree(): Promise<TerritoryTreeData> {
  try {
    // Fetch all locations
    const { data: locs, error: locErr } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('geographic_path');

    if (locErr) {
      logger.error('territorial.queries.fetchTerritoryTree - locations', locErr);
      throw new Error(`Erro ao buscar localizações: ${locErr.message}`);
    }

    const locations: TerritoryNode[] = (locs || []).map((l: any) => ({
      id: l.id,
      name: l.name || 'Sem nome',
      slug: l.slug || '',
      type: l.type || 'district',
      parent_id: l.parent_id || null,
      geographic_path: l.geographic_path || '',
      status: l.status || 'inactive',
      is_selector_active: l.metadata?.is_selector_active === true,
      is_landing_enabled: l.metadata?.is_landing_enabled !== false,
      is_navigable: l.metadata?.is_navigable !== false,
      metadata: l.metadata || {},
    }));

    // Fetch all territorial groups with anchor city info
    const { data: grps, error: grpErr } = await supabaseAdmin
      .from('territorial_groups')
      .select('*, anchor_city:locations!territorial_groups_anchor_city_id_fkey(name)');

    if (grpErr) {
      logger.error('territorial.queries.fetchTerritoryTree - groups', grpErr);
      return { locations, groups: [], groupMembers: new Map() };
    }

    // Get member counts and member IDs
    const { data: members } = await supabaseAdmin
      .from('territorial_group_members')
      .select('group_id, location_id');

    const countMap: Record<string, number> = {};
    const memberMap = new Map<string, string[]>();

    (members || []).forEach((m: any) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;

      if (!memberMap.has(m.group_id)) {
        memberMap.set(m.group_id, []);
      }
      memberMap.get(m.group_id)!.push(m.location_id);
    });

    const groups: TerritoryNode[] = (grps || []).map((g: any) => ({
      id: g.id,
      name: g.name || 'Sem nome',
      slug: g.slug || '',
      type: 'group' as const,
      parent_id: g.anchor_city_id || null,
      status: g.status || 'inactive',
      is_selector_active: g.metadata?.is_selector_active === true,
      is_landing_enabled: g.metadata?.is_landing_enabled !== false,
      is_navigable: g.metadata?.is_navigable !== false,
      member_count: countMap[g.id] || 0,
      member_ids: memberMap.get(g.id) || [],
      anchor_city_name: g.anchor_city?.name || '',
      metadata: g.metadata || {},
    }));

    return { locations, groups, groupMembers: memberMap };
  } catch (error) {
    logger.error('territorial.queries.fetchTerritoryTree', error);
    throw error;
  }
}
