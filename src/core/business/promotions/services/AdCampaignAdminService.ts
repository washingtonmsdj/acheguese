import { supabase } from "@/integrations/supabase";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import type {
  AdCampaignBillingStatus,
  AdCampaignReviewStatus,
  AdCampaignSource,
  AdCampaignStatus,
  AdPlacementKey,
} from "@/core/business/promotions/types";

const CAMPAIGNS_TABLE = "ad_campaigns";
const ADMIN_CAMPAIGN_SELECT = [
  "id",
  "owner_business_id",
  "created_by_profile_id",
  "advertiser_name",
  "advertiser_contact",
  "title",
  "description",
  "image_url",
  "cta_label",
  "cta_url",
  "status",
  "review_status",
  "billing_status",
  "source",
  "placement_key",
  "priority",
  "starts_at",
  "ends_at",
  "budget_total",
  "budget_spent",
  "impressions",
  "clicks",
  "territory_ref_id",
  "territory_type",
  "approved_at",
  "approved_by_profile_id",
  "rejection_reason",
  "created_at",
  "updated_at",
].join(",");

export type AdminAdCampaignTerritoryType = "city" | "district" | "neighborhood";

export interface AdminAdCampaignSummary {
  id: string;
  owner_business_id: string | null;
  created_by_profile_id: string | null;
  advertiser_name: string;
  advertiser_contact: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  status: AdCampaignStatus;
  review_status: AdCampaignReviewStatus;
  billing_status: AdCampaignBillingStatus;
  source: AdCampaignSource;
  placement_key: AdPlacementKey;
  priority: number;
  starts_at: string;
  ends_at: string | null;
  budget_total: number;
  budget_spent: number;
  impressions: number;
  clicks: number;
  territory_ref_id: string;
  territory_type: AdminAdCampaignTerritoryType;
  approved_at: string | null;
  approved_by_profile_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAdCampaignStats {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  active: number;
  awaitingBilling: number;
  paidOrAuthorized: number;
  plannedBudget: number;
  spentBudget: number;
}

export interface AdminAdCampaignListResult {
  data: AdminAdCampaignSummary[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAdCampaignListParams {
  page?: number;
  limit?: number;
  search?: string;
  reviewStatus?: AdCampaignReviewStatus | "all";
  billingStatus?: AdCampaignBillingStatus | "all";
  status?: AdCampaignStatus | "all";
  placementKey?: AdPlacementKey | "all";
}

export interface AdminAdCampaignStateInput {
  reviewStatus?: Exclude<AdCampaignReviewStatus, "draft">;
  billingStatus?: AdCampaignBillingStatus;
  status?: AdCampaignStatus;
  priority?: number;
  rejectionReason?: string | null;
}

type ErrorLike = { message?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleRpcPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
};

type QueryBuilder<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  or(filters: string): QueryBuilder<TRow>;
  order(column: string, options?: { ascending: boolean }): QueryBuilder<TRow>;
  range(from: number, to: number): QueryBuilder<TRow>;
};

type AdCampaignAdminDbClient = {
  from<TRow = Record<string, unknown>>(table: typeof CAMPAIGNS_TABLE): QueryBuilder<TRow>;
  rpc<TRow = unknown>(
    functionName: "admin_update_ad_campaign_state",
    args: {
      p_campaign_id: string;
      p_payload: Record<string, unknown>;
    },
  ): Promise<SingleRpcPayload<TRow>>;
};

type AdminAdCampaignRow = Omit<
  AdminAdCampaignSummary,
  "priority" | "budget_total" | "budget_spent" | "impressions" | "clicks"
> & {
  priority: number | null;
  budget_total: number | string | null;
  budget_spent: number | string | null;
  impressions: number | null;
  clicks: number | null;
};

const adsAdminDb = supabase as unknown as AdCampaignAdminDbClient;

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapCampaign(row: AdminAdCampaignRow): AdminAdCampaignSummary {
  return {
    ...row,
    priority: row.priority ?? 0,
    budget_total: toNumber(row.budget_total),
    budget_spent: toNumber(row.budget_spent),
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
  };
}

function normalizeText(value: string | null | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function buildStatePayload(input: AdminAdCampaignStateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.reviewStatus !== undefined) payload.review_status = input.reviewStatus;
  if (input.billingStatus !== undefined) payload.billing_status = input.billingStatus;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;

  const reason = normalizeText(input.rejectionReason, 500);
  if (reason !== undefined) payload.rejection_reason = reason;

  return payload;
}

export class AdCampaignAdminService {
  static async getStats(): Promise<AdminAdCampaignStats> {
    const { data, error } = await adsAdminDb
      .from<AdminAdCampaignRow>(CAMPAIGNS_TABLE)
      .select(
        "status,review_status,billing_status,budget_total,budget_spent",
      );

    if (error) throw new Error(error.message ?? "Nao foi possivel carregar metricas.");

    const rows = data ?? [];
    return rows.reduce<AdminAdCampaignStats>(
      (stats, row) => ({
        total: stats.total + 1,
        pendingReview: stats.pendingReview + (row.review_status === "pending" ? 1 : 0),
        approved: stats.approved + (row.review_status === "approved" ? 1 : 0),
        rejected: stats.rejected + (row.review_status === "rejected" ? 1 : 0),
        active: stats.active + (row.status === "active" ? 1 : 0),
        awaitingBilling: stats.awaitingBilling + (row.billing_status === "unpaid" ? 1 : 0),
        paidOrAuthorized:
          stats.paidOrAuthorized +
          (row.billing_status === "authorized" || row.billing_status === "paid" ? 1 : 0),
        plannedBudget: stats.plannedBudget + toNumber(row.budget_total),
        spentBudget: stats.spentBudget + toNumber(row.budget_spent),
      }),
      {
        total: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        awaitingBilling: 0,
        paidOrAuthorized: 0,
        plannedBudget: 0,
        spentBudget: 0,
      },
    );
  }

  static async listCampaigns(
    params: AdminAdCampaignListParams = {},
  ): Promise<AdminAdCampaignListResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = adsAdminDb
      .from<AdminAdCampaignRow>(CAMPAIGNS_TABLE)
      .select(ADMIN_CAMPAIGN_SELECT, { count: "exact" });

    const searchFilter = buildSafeOrILikeFilter(
      ["advertiser_name", "title", "description"],
      params.search,
    );
    if (searchFilter) query = query.or(searchFilter);

    if (params.reviewStatus && params.reviewStatus !== "all") {
      query = query.eq("review_status", params.reviewStatus);
    }
    if (params.billingStatus && params.billingStatus !== "all") {
      query = query.eq("billing_status", params.billingStatus);
    }
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.placementKey && params.placementKey !== "all") {
      query = query.eq("placement_key", params.placementKey);
    }

    const { data, error, count } = await query
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message ?? "Nao foi possivel listar anuncios.");

    return {
      data: (data ?? []).map(mapCampaign),
      count: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  static async updateCampaignState(
    campaignId: string,
    input: AdminAdCampaignStateInput,
  ): Promise<AdminAdCampaignSummary> {
    const id = campaignId.trim();
    if (!id) throw new Error("Campanha invalida.");

    const payload = buildStatePayload(input);
    if (Object.keys(payload).length === 0) {
      throw new Error("Nenhuma alteracao informada.");
    }

    const { data, error } = await adsAdminDb.rpc<AdminAdCampaignRow>(
      "admin_update_ad_campaign_state",
      {
        p_campaign_id: id,
        p_payload: payload,
      },
    );

    if (error) throw new Error(error.message ?? "Nao foi possivel atualizar anuncio.");
    if (!data) throw new Error("A atualizacao nao retornou campanha.");

    return mapCampaign(data);
  }
}
