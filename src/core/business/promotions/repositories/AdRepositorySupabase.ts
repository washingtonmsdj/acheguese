import { supabase } from "@/integrations/supabase";
import type { IAdRepository } from "./IAdRepository";
import type { AdCampaignWithTargets, AdPlacementKey, AdTarget } from "../types";

const CAMPAIGNS_TABLE = "ad_campaigns";
const TARGETS_TABLE = "ad_targets";

type AdCampaignRow = {
  id: string;
  owner_entity_type: AdCampaignWithTargets["owner_entity_type"];
  owner_entity_id: string;
  title: string;
  content: string;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  status: AdCampaignWithTargets["status"];
  placement_key: AdPlacementKey;
  created_at: string;
  updated_at: string;
};

type AdTargetRow = {
  campaign_id: string;
  location_id: string;
  target_scope: AdTarget["target_scope"];
};

type QueryPayload<T> = {
  data: T[] | null;
  error: { message?: string | null } | null;
};

type QueryBuilder<T> = PromiseLike<QueryPayload<T>> & {
  select(columns: string): QueryBuilder<T>;
  in(column: string, values: readonly string[]): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  order(column: string, options: { ascending: boolean }): QueryBuilder<T>;
  maybeSingle(): Promise<{
    data: T | null;
    error: { message?: string | null } | null;
  }>;
};

type AdsDbClient = {
  from(table: typeof CAMPAIGNS_TABLE): QueryBuilder<AdCampaignRow>;
  from(table: typeof TARGETS_TABLE): QueryBuilder<AdTargetRow>;
};

const adsDb = supabase as unknown as AdsDbClient;

function rowToCampaign(row: AdCampaignRow, targets: AdTarget[]): AdCampaignWithTargets {
  return {
    id: row.id,
    owner_entity_type: row.owner_entity_type,
    owner_entity_id: row.owner_entity_id,
    title: row.title,
    content: row.content,
    image_url: row.image_url ?? undefined,
    cta_text: row.cta_text ?? undefined,
    cta_url: row.cta_url ?? undefined,
    status: row.status,
    placement_key: row.placement_key,
    created_at: row.created_at,
    updated_at: row.updated_at,
    targets,
  };
}

function rowToTarget(row: AdTargetRow): AdTarget {
  return {
    campaign_id: row.campaign_id,
    location_id: row.location_id,
    target_scope: row.target_scope,
  };
}

export class AdRepositorySupabase implements IAdRepository {
  async findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[],
  ): Promise<AdCampaignWithTargets[]> {
    if (location_ids.length === 0) return [];

    const { data: targetRows, error: targetError } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id, location_id, target_scope")
      .in("location_id", location_ids);

    if (targetError) throw new Error(targetError.message);
    if (!targetRows?.length) return [];

    const campaignIds = [...new Set(targetRows.map((target) => target.campaign_id))];

    const { data: campaignRows, error: campaignError } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select("*")
      .in("id", campaignIds)
      .eq("status", "active")
      .eq("placement_key", placement_key)
      .order("created_at", { ascending: false });

    if (campaignError) throw new Error(campaignError.message);
    if (!campaignRows?.length) return [];

    return campaignRows.map((row) => {
      const targets = targetRows
        .filter((target) => target.campaign_id === row.id)
        .map(rowToTarget);
      return rowToCampaign(row, targets);
    });
  }

  async findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]> {
    const { data: campaignRows, error } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select("*")
      .eq("status", "active")
      .eq("placement_key", placement_key)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!campaignRows?.length) return [];

    const { data: allTargets } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id")
      .in("campaign_id", campaignRows.map((row) => row.id));

    const campaignIdsWithTargets = new Set((allTargets ?? []).map((target) => target.campaign_id));

    return campaignRows
      .filter((row) => !campaignIdsWithTargets.has(row.id))
      .map((row) => rowToCampaign(row, []));
  }

  async findById(id: string): Promise<AdCampaignWithTargets | null> {
    const { data: row, error } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    const { data: targetRows } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id, location_id, target_scope")
      .eq("campaign_id", id);

    return rowToCampaign(row, (targetRows ?? []).map(rowToTarget));
  }
}
