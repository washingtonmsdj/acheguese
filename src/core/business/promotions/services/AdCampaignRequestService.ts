import { supabase } from "@/integrations/supabase";
import type {
  AdCampaignBillingStatus,
  AdCampaignReviewStatus,
  AdCampaignSource,
  AdCampaignStatus,
  AdPlacementKey,
  AdTargetScope,
} from "@/core/business/promotions/types";

const CAMPAIGNS_TABLE = "ad_campaigns";
const CAMPAIGN_MANAGEMENT_SELECT = [
  "id",
  "owner_business_id",
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
  "territory_ref_id",
  "territory_type",
  "created_at",
  "updated_at",
].join(",");

export type AdCampaignTerritoryType = "city" | "district" | "neighborhood";

export interface AdCampaignRequestInput {
  ownerBusinessId: string;
  advertiserName: string;
  advertiserContact?: string | null;
  title: string;
  description: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  placementKey: AdPlacementKey;
  startsAt: string;
  endsAt?: string | null;
  budgetTotal?: number | null;
  territoryRefId: string;
  territoryType: AdCampaignTerritoryType;
  targets?: Array<{
    locationId: string;
    targetScope: AdTargetScope;
  }>;
}

export interface BusinessAdCampaignSummary {
  id: string;
  owner_business_id: string | null;
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
  budget_total: number | null;
  territory_ref_id: string;
  territory_type: AdCampaignTerritoryType;
  created_at: string;
  updated_at: string;
}

type AdCampaignManagementRow = BusinessAdCampaignSummary;

type QueryPayload<T> = {
  data: T[] | null;
  error: { message?: string | null } | null;
};

type QueryBuilder<T> = PromiseLike<QueryPayload<T>> & {
  select(columns: string): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  order(column: string, options: { ascending: boolean }): QueryBuilder<T>;
};

type AdCampaignRequestPayload = {
  owner_business_id: string;
  advertiser_name: string;
  advertiser_contact?: string;
  title: string;
  description: string;
  image_url?: string;
  cta_label?: string;
  cta_url?: string;
  placement_key: AdPlacementKey;
  starts_at: string;
  ends_at?: string;
  budget_total?: number;
  territory_ref_id: string;
  territory_type: AdCampaignTerritoryType;
  targets: Array<{
    location_id: string;
    target_scope: AdTargetScope;
  }>;
};

type AdCampaignManagementDbClient = {
  from(table: typeof CAMPAIGNS_TABLE): QueryBuilder<AdCampaignManagementRow>;
  rpc(
    functionName: "request_ad_campaign",
    args: { payload: AdCampaignRequestPayload },
  ): Promise<{
    data: string | null;
    error: { message?: string | null } | null;
  }>;
};

const adsManagementDb = supabase as unknown as AdCampaignManagementDbClient;

function trimRequired(
  value: string,
  fieldName: string,
  maxLength: number,
  minLength = 1,
): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${fieldName} e obrigatorio.`);
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} deve ter pelo menos ${minLength} caracteres.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} excede ${maxLength} caracteres.`);
  }
  return trimmed;
}

function trimOptional(value: string | null | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) {
    throw new Error(`Campo excede ${maxLength} caracteres.`);
  }
  return trimmed;
}

function normalizeIsoDate(value: string, fieldName: string): string {
  const trimmed = trimRequired(value, fieldName, 40);
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00.000Z`
    : trimmed;
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} invalido.`);
  }
  return date.toISOString();
}

function normalizeOptionalIsoDate(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return normalizeIsoDate(trimmed, "Data final");
}

function normalizeBudget(value: number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Orcamento invalido.");
  }
  return Number(value.toFixed(2));
}

function buildPayload(input: AdCampaignRequestInput): AdCampaignRequestPayload {
  const territoryRefId = trimRequired(input.territoryRefId, "Territorio", 80);
  const territoryType = input.territoryType;
  const targets = input.targets?.length
    ? input.targets
    : [{ locationId: territoryRefId, targetScope: territoryType }];

  return {
    owner_business_id: trimRequired(input.ownerBusinessId, "Empresa", 80),
    advertiser_name: trimRequired(input.advertiserName, "Anunciante", 120, 2),
    advertiser_contact: trimOptional(input.advertiserContact, 160),
    title: trimRequired(input.title, "Titulo", 90, 4),
    description: trimRequired(input.description, "Descricao", 220, 8),
    image_url: trimOptional(input.imageUrl, 500),
    cta_label: trimOptional(input.ctaLabel, 36),
    cta_url: trimOptional(input.ctaUrl, 500),
    placement_key: input.placementKey,
    starts_at: normalizeIsoDate(input.startsAt, "Data inicial"),
    ends_at: normalizeOptionalIsoDate(input.endsAt),
    budget_total: normalizeBudget(input.budgetTotal),
    territory_ref_id: territoryRefId,
    territory_type: territoryType,
    targets: targets.map((target) => ({
      location_id: trimRequired(target.locationId, "Target", 80),
      target_scope: target.targetScope,
    })),
  };
}

export class AdCampaignRequestService {
  static async listBusinessCampaigns(
    ownerBusinessId: string,
  ): Promise<BusinessAdCampaignSummary[]> {
    const businessId = ownerBusinessId.trim();
    if (!businessId) return [];

    const { data, error } = await adsManagementDb
      .from(CAMPAIGNS_TABLE)
      .select(CAMPAIGN_MANAGEMENT_SELECT)
      .eq("owner_business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message ?? "Nao foi possivel listar anuncios.");
    return data ?? [];
  }

  static async requestBusinessCampaign(input: AdCampaignRequestInput): Promise<string> {
    const payload = buildPayload(input);
    const { data, error } = await adsManagementDb.rpc("request_ad_campaign", { payload });

    if (error) throw new Error(error.message ?? "Nao foi possivel solicitar anuncio.");
    if (!data) throw new Error("A solicitacao nao retornou identificador.");
    return data;
  }
}
