import { supabase } from "@/integrations/supabase";
import type { IAdRepository } from "./IAdRepository";
import type { AdCampaignWithTargets, AdPlacementKey, AdTarget } from "../types";

const CAMPAIGNS_TABLE = "ad_campaigns";
const TARGETS_TABLE = "ad_targets";
const CAMPAIGN_SELECT = [
  "id",
  "advertiser_name",
  "title",
  "description",
  "image_url",
  "cta_label",
  "cta_url",
  "status",
  "review_status",
  "billing_status",
  "placement_key",
  "priority",
  "starts_at",
  "ends_at",
  "created_at",
  "updated_at",
].join(",");

type AdCampaignRow = {
  id: string;
  advertiser_name: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  status: AdCampaignWithTargets["status"];
  review_status: AdCampaignWithTargets["review_status"];
  billing_status: AdCampaignWithTargets["billing_status"];
  placement_key: AdPlacementKey;
  priority: number | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdTargetRow = {
  campaign_id: string;
  location_id: string;
  target_scope: string;
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
    advertiser_name: row.advertiser_name,
    title: row.title,
    description: row.description,
    image_url: row.image_url ?? undefined,
    cta_label: row.cta_label ?? undefined,
    cta_url: row.cta_url ?? undefined,
    status: row.status,
    review_status: row.review_status,
    billing_status: row.billing_status,
    placement_key: row.placement_key,
    priority: row.priority ?? undefined,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    targets,
  };
}

function rowToTarget(row: AdTargetRow): AdTarget {
  const targetScope =
    row.target_scope === "district" || row.target_scope === "neighborhood"
      ? row.target_scope
      : "city";

  return {
    campaign_id: row.campaign_id,
    location_id: row.location_id,
    target_scope: targetScope,
  };
}

function isCampaignDeliverable(row: AdCampaignRow, nowIso: string): boolean {
  return row.starts_at <= nowIso && (!row.ends_at || row.ends_at > nowIso);
}

export class AdRepositorySupabase implements IAdRepository {
  async findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[],
  ): Promise<AdCampaignWithTargets[]> {
    if (location_ids.length === 0) return [];
    const nowIso = new Date().toISOString();

    const { data: targetRows, error: targetError } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id, location_id, target_scope")
      .in("location_id", location_ids);

    if (targetError) throw new Error(targetError.message);
    if (!targetRows?.length) return [];

    const campaignIds = [...new Set(targetRows.map((target) => target.campaign_id))];

    const { data: campaignRows, error: campaignError } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select(CAMPAIGN_SELECT)
      .in("id", campaignIds)
      .eq("status", "active")
      .eq("review_status", "approved")
      .in("billing_status", ["authorized", "paid"])
      .eq("placement_key", placement_key)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });

    if (campaignError) throw new Error(campaignError.message);
    if (!campaignRows?.length) return [];

    return campaignRows
      .filter((row) => isCampaignDeliverable(row, nowIso))
      .map((row) => {
        const targets = targetRows
          .filter((target) => target.campaign_id === row.id)
          .map(rowToTarget);
        return rowToCampaign(row, targets);
      });
  }

  async findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]> {
    const nowIso = new Date().toISOString();
    const { data: campaignRows, error } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select(CAMPAIGN_SELECT)
      .eq("status", "active")
      .eq("review_status", "approved")
      .in("billing_status", ["authorized", "paid"])
      .eq("placement_key", placement_key)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!campaignRows?.length) return [];

    const { data: allTargets } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id")
      .in("campaign_id", campaignRows.map((row) => row.id));

    const campaignIdsWithTargets = new Set((allTargets ?? []).map((target) => target.campaign_id));

    return campaignRows
      .filter((row) => isCampaignDeliverable(row, nowIso))
      .filter((row) => !campaignIdsWithTargets.has(row.id))
      .map((row) => rowToCampaign(row, []));
  }

  async findById(id: string): Promise<AdCampaignWithTargets | null> {
    const { data: row, error } = await adsDb
      .from(CAMPAIGNS_TABLE)
      .select(CAMPAIGN_SELECT)
      .eq("id", id)
      .eq("status", "active")
      .eq("review_status", "approved")
      .in("billing_status", ["authorized", "paid"])
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || !isCampaignDeliverable(row, new Date().toISOString())) return null;

    const { data: targetRows } = await adsDb
      .from(TARGETS_TABLE)
      .select("campaign_id, location_id, target_scope")
      .eq("campaign_id", id);

    return rowToCampaign(row, (targetRows ?? []).map(rowToTarget));
  }
}
