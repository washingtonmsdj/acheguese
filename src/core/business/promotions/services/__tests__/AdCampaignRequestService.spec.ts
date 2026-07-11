import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockOrder = vi.fn();
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockEq, mockFrom, mockOrder, mockRpc };
});

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: supabaseMocks.mockFrom,
    rpc: supabaseMocks.mockRpc,
  },
}));

import { AdCampaignRequestService } from "../AdCampaignRequestService";

describe("AdCampaignRequestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a campaign through the canonical RPC payload", async () => {
    supabaseMocks.mockRpc.mockResolvedValueOnce({ data: "campaign-1", error: null });

    const result = await AdCampaignRequestService.requestBusinessCampaign({
      ownerBusinessId: "business-1",
      advertiserName: "Padaria Central",
      advertiserContact: "contato@example.com",
      title: "Pao frances em destaque",
      description: "Fresquinho todos os dias para o bairro.",
      ctaLabel: "Ver empresa",
      ctaUrl: "/empresas/ba/salvador/pituba/padaria-central",
      imageUrl: "https://cdn.example.com/ad.png",
      placementKey: "sidebar_widget",
      startsAt: "2026-07-09",
      budgetTotal: 100,
      territoryRefId: "location-1",
      territoryType: "district",
    });

    expect(result).toBe("campaign-1");
    expect(supabaseMocks.mockRpc).toHaveBeenCalledWith("request_ad_campaign", {
      payload: expect.objectContaining({
        owner_business_id: "business-1",
        advertiser_name: "Padaria Central",
        title: "Pao frances em destaque",
        description: "Fresquinho todos os dias para o bairro.",
        placement_key: "sidebar_widget",
        starts_at: "2026-07-09T00:00:00.000Z",
        budget_total: 100,
        territory_ref_id: "location-1",
        territory_type: "district",
        targets: [{ location_id: "location-1", target_scope: "district" }],
      }),
    });
  });

  it("rejects invalid request data before calling Supabase", async () => {
    await expect(
      AdCampaignRequestService.requestBusinessCampaign({
        ownerBusinessId: "business-1",
        advertiserName: "Padaria Central",
        title: "Ad",
        description: "Curta",
        placementKey: "sidebar_widget",
        startsAt: "2026-07-09",
        territoryRefId: "location-1",
        territoryType: "district",
      }),
    ).rejects.toThrow("Titulo");

    expect(supabaseMocks.mockRpc).not.toHaveBeenCalled();
  });

  it("lists campaigns by owner business id", async () => {
    supabaseMocks.mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: "campaign-1",
          owner_business_id: "business-1",
          advertiser_name: "Padaria Central",
          advertiser_contact: null,
          title: "Pao frances em destaque",
          description: "Fresquinho todos os dias para o bairro.",
          image_url: null,
          cta_label: "Ver empresa",
          cta_url: "/empresas/ba/salvador/pituba/padaria-central",
          status: "paused",
          review_status: "pending",
          billing_status: "unpaid",
          source: "self_service",
          placement_key: "sidebar_widget",
          priority: 0,
          starts_at: "2026-07-09T00:00:00.000Z",
          ends_at: null,
          budget_total: 100,
          territory_ref_id: "location-1",
          territory_type: "district",
          created_at: "2026-07-09T00:00:00.000Z",
          updated_at: "2026-07-09T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await AdCampaignRequestService.listBusinessCampaigns("business-1");

    expect(result).toHaveLength(1);
    expect(supabaseMocks.mockFrom).toHaveBeenCalledWith("ad_campaigns");
    expect(supabaseMocks.mockEq).toHaveBeenCalledWith("owner_business_id", "business-1");
    expect(supabaseMocks.mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
