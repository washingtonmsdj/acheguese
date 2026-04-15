/**
 * AdRepositorySupabase
 *
 * Implementação real de IAdRepository usando Supabase.
 *
 * STATUS: implementado, NÃO validado em runtime — banco desligado.
 * Validar quando VITE_USE_MOCK_DATA=false e tabelas ad_campaigns/ad_targets existirem.
 *
 * Migration necessária: src/modules/ads/sql/001_ads_tables.sql (a criar)
 */

import { supabase } from '@/integrations/supabase';
import type { IAdRepository } from './IAdRepository';
import type { AdCampaignWithTargets, AdPlacementKey, AdTarget } from '../types';

const CAMPAIGNS_TABLE = 'ad_campaigns';
const TARGETS_TABLE = 'ad_targets';

function rowToCampaign(row: Record<string, unknown>, targets: AdTarget[]): AdCampaignWithTargets {
  return {
    id: row.id as string,
    owner_entity_type: row.owner_entity_type as AdCampaignWithTargets['owner_entity_type'],
    owner_entity_id: row.owner_entity_id as string,
    title: row.title as string,
    content: row.content as string,
    image_url: (row.image_url as string | undefined) ?? undefined,
    cta_text: (row.cta_text as string | undefined) ?? undefined,
    cta_url: (row.cta_url as string | undefined) ?? undefined,
    status: row.status as AdCampaignWithTargets['status'],
    placement_key: row.placement_key as AdPlacementKey,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    targets,
  };
}

function rowToTarget(row: Record<string, unknown>): AdTarget {
  return {
    campaign_id: row.campaign_id as string,
    location_id: row.location_id as string,
    target_scope: row.target_scope as AdTarget['target_scope'],
  };
}

export class AdRepositorySupabase implements IAdRepository {
  async findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[]
  ): Promise<AdCampaignWithTargets[]> {
    if (location_ids.length === 0) return [];

    // Busca targets que batem com os location_ids
    const { data: targetRows, error: targetError } = await (supabase as any)
      .from(TARGETS_TABLE)
      .select('campaign_id, location_id, target_scope')
      .in('location_id', location_ids);

    if (targetError) throw new Error(targetError.message);
    if (!targetRows || targetRows.length === 0) return [];

    const campaignIds = [...new Set((targetRows as Record<string, unknown>[]).map((t) => t.campaign_id as string))];

    // Busca campanhas ativas para esses IDs e placement
    const { data: campaignRows, error: campaignError } = await (supabase as any)
      .from(CAMPAIGNS_TABLE)
      .select('*')
      .in('id', campaignIds)
      .eq('status', 'active')
      .eq('placement_key', placement_key)
      .order('created_at', { ascending: false });

    if (campaignError) throw new Error(campaignError.message);
    if (!campaignRows) return [];

    return (campaignRows as Record<string, unknown>[]).map((row) => {
      const targets = (targetRows as Record<string, unknown>[])
        .filter((t) => t.campaign_id === row.id)
        .map(rowToTarget);
      return rowToCampaign(row, targets);
    });
  }

  async findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]> {
    // Campanhas sem targets = genéricas
    const { data: campaignRows, error } = await (supabase as any)
      .from(CAMPAIGNS_TABLE)
      .select('*')
      .eq('status', 'active')
      .eq('placement_key', placement_key)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!campaignRows) return [];

    // Filtrar apenas as que não têm targets
    const { data: allTargets } = await (supabase as any)
      .from(TARGETS_TABLE)
      .select('campaign_id')
      .in('campaign_id', (campaignRows as Record<string, unknown>[]).map((r) => r.id));

    const campaignIdsWithTargets = new Set(
      ((allTargets ?? []) as Record<string, unknown>[]).map((t) => t.campaign_id as string)
    );

    return (campaignRows as Record<string, unknown>[])
      .filter((row) => !campaignIdsWithTargets.has(row.id as string))
      .map((row) => rowToCampaign(row, []));
  }

  async findById(id: string): Promise<AdCampaignWithTargets | null> {
    const { data: row, error } = await (supabase as any)
      .from(CAMPAIGNS_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    const { data: targetRows } = await (supabase as any)
      .from(TARGETS_TABLE)
      .select('campaign_id, location_id, target_scope')
      .eq('campaign_id', id);

    const targets = ((targetRows ?? []) as Record<string, unknown>[]).map(rowToTarget);
    return rowToCampaign(row, targets);
  }
}
