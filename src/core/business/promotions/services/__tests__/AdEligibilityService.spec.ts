import { describe, expect, it, vi } from "vitest";
import type { IAdRepository } from "../../repositories/IAdRepository";
import type { AdCampaignWithTargets } from "../../types";
import { AdEligibilityService } from "../AdEligibilityService";

function campaign(
  id: string,
  targets: AdCampaignWithTargets["targets"],
  priority = 0,
): AdCampaignWithTargets {
  return {
    id,
    advertiser_name: "Padaria Central",
    title: `Campanha ${id}`,
    description: "Oferta local aprovada.",
    status: "active",
    review_status: "approved",
    billing_status: "paid",
    placement_key: "sidebar_widget",
    priority,
    starts_at: "2026-07-09T00:00:00.000Z",
    ends_at: null,
    created_at: "2026-07-09T00:00:00.000Z",
    updated_at: "2026-07-09T00:00:00.000Z",
    targets,
  };
}

function repository(campaigns: AdCampaignWithTargets[]): IAdRepository {
  return {
    findActiveCampaignsByLocationIds: vi.fn(async () => campaigns),
    findGenericCampaigns: vi.fn(async () => []),
    findById: vi.fn(async () => null),
  };
}

describe("AdEligibilityService", () => {
  it("prefers exact neighborhood campaigns before city campaigns", async () => {
    const cityCampaign = campaign("city", [
      { campaign_id: "city", location_id: "city-1", target_scope: "city" },
    ]);
    const neighborhoodCampaign = campaign("neighborhood", [
      {
        campaign_id: "neighborhood",
        location_id: "neighborhood-1",
        target_scope: "neighborhood",
      },
    ]);
    const service = new AdEligibilityService(
      repository([cityCampaign, neighborhoodCampaign]),
    );

    const result = await service.resolve("sidebar_widget", {
      active_location_id: "neighborhood-1",
      active_location_type: "neighborhood",
      parent_city_id: "city-1",
      fallback_location_id: null,
    });

    expect(result.campaign?.id).toBe("neighborhood");
    expect(result.resolution_source).toBe("neighborhood");
  });

  it("uses the parent city when there is no exact local campaign", async () => {
    const cityCampaign = campaign("city", [
      { campaign_id: "city", location_id: "city-1", target_scope: "city" },
    ]);
    const service = new AdEligibilityService(repository([cityCampaign]));

    const result = await service.resolve("sidebar_widget", {
      active_location_id: "district-1",
      active_location_type: "district",
      parent_city_id: "city-1",
      fallback_location_id: null,
    });

    expect(result.campaign?.id).toBe("city");
    expect(result.resolution_source).toBe("city");
  });

  it("keeps district and neighborhood compatible only for the same location id", async () => {
    const localCampaign = campaign("local", [
      { campaign_id: "local", location_id: "neighborhood-1", target_scope: "district" },
    ]);
    const service = new AdEligibilityService(repository([localCampaign]));

    const result = await service.resolve("sidebar_widget", {
      active_location_id: "neighborhood-1",
      active_location_type: "neighborhood",
      parent_city_id: "city-1",
      fallback_location_id: null,
    });

    expect(result.campaign?.id).toBe("local");
    expect(result.resolution_source).toBe("neighborhood");
  });
});
