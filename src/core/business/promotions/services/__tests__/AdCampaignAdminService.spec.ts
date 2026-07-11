import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryPayload<T> = {
  data: T[] | null;
  error: { message?: string | null } | null;
  count?: number | null;
};

type Builder<T> = PromiseLike<QueryPayload<T>> & {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
};

const supabaseMocks = vi.hoisted(() => {
  const builders: Array<Builder<unknown>> = [];
  const mockRpc = vi.fn();
  const mockFrom = vi.fn(() => {
    const builder = builders.shift();
    if (!builder) throw new Error("No query builder queued");
    return builder;
  });

  function queueBuilder<T>(payload: QueryPayload<T>): Builder<T> {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn(() => builder),
      then: (resolve: (value: QueryPayload<T>) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(payload).then(resolve, reject),
    } as Builder<T>;

    builders.push(builder as Builder<unknown>);
    return builder;
  }

  return { builders, mockFrom, mockRpc, queueBuilder };
});

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: supabaseMocks.mockFrom,
    rpc: supabaseMocks.mockRpc,
  },
}));

import { AdCampaignAdminService } from "../AdCampaignAdminService";

const campaignRow = {
  id: "campaign-1",
  owner_business_id: "business-1",
  created_by_profile_id: "profile-1",
  advertiser_name: "Padaria Central",
  advertiser_contact: null,
  title: "Pao frances em destaque",
  description: "Fresquinho todos os dias.",
  image_url: null,
  cta_label: "Ver empresa",
  cta_url: "/empresas/padaria-central",
  status: "paused",
  review_status: "pending",
  billing_status: "unpaid",
  source: "self_service",
  placement_key: "sidebar_widget",
  priority: 0,
  starts_at: "2026-07-09T00:00:00.000Z",
  ends_at: null,
  budget_total: "100.00",
  budget_spent: "0.00",
  impressions: 0,
  clicks: 0,
  territory_ref_id: "location-1",
  territory_type: "district",
  approved_at: null,
  approved_by_profile_id: null,
  rejection_reason: null,
  created_at: "2026-07-09T00:00:00.000Z",
  updated_at: "2026-07-09T00:00:00.000Z",
} as const;

describe("AdCampaignAdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.builders.length = 0;
  });

  it("lists campaigns with safe admin filters", async () => {
    const builder = supabaseMocks.queueBuilder({
      data: [campaignRow],
      error: null,
      count: 1,
    });

    const result = await AdCampaignAdminService.listCampaigns({
      page: 2,
      limit: 10,
      search: "padaria",
      reviewStatus: "pending",
      billingStatus: "unpaid",
      status: "paused",
      placementKey: "sidebar_widget",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].budget_total).toBe(100);
    expect(supabaseMocks.mockFrom).toHaveBeenCalledWith("ad_campaigns");
    expect(builder.or).toHaveBeenCalledWith(
      "advertiser_name.ilike.%padaria%,title.ilike.%padaria%,description.ilike.%padaria%",
    );
    expect(builder.eq).toHaveBeenCalledWith("review_status", "pending");
    expect(builder.eq).toHaveBeenCalledWith("billing_status", "unpaid");
    expect(builder.eq).toHaveBeenCalledWith("status", "paused");
    expect(builder.eq).toHaveBeenCalledWith("placement_key", "sidebar_widget");
    expect(builder.range).toHaveBeenCalledWith(10, 19);
  });

  it("updates campaign state through the admin invoker RPC", async () => {
    supabaseMocks.mockRpc.mockResolvedValueOnce({
      data: { ...campaignRow, review_status: "approved", priority: 25 },
      error: null,
    });

    const result = await AdCampaignAdminService.updateCampaignState("campaign-1", {
      reviewStatus: "approved",
      priority: 25,
    });

    expect(result.review_status).toBe("approved");
    expect(result.priority).toBe(25);
    expect(supabaseMocks.mockRpc).toHaveBeenCalledWith("admin_update_ad_campaign_state", {
      p_campaign_id: "campaign-1",
      p_payload: {
        review_status: "approved",
        priority: 25,
      },
    });
  });

  it("rejects empty updates before calling Supabase", async () => {
    await expect(
      AdCampaignAdminService.updateCampaignState("campaign-1", {}),
    ).rejects.toThrow("Nenhuma alteracao");

    expect(supabaseMocks.mockRpc).not.toHaveBeenCalled();
  });
});
