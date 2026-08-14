import { describe, expect, it } from "vitest";
import type { TerritorialCommunityProfile } from "@/core/community-experience/types";
import { resolveCommunitySurfaceState } from "./CommunitySurfacePolicy";

const ACTIVE_PROFILE: TerritorialCommunityProfile = {
  id: "3b5e6c3f-22f5-4e69-9d25-f89e8e9049e1",
  name: "Achegue-se Complexo",
  slug: "complexo-do-nordeste-de-amaralina",
  city_id: "63c410df-8db1-4f33-a822-fb34f20cde70",
  territory_type: "territorial_group",
  territory_id: "fc322f36-cb01-4c88-9d7d-f9c3b209ea89",
  status: "active",
  headline: null,
  description: null,
  launch_message: null,
  hero_title: null,
  hero_subtitle: null,
  primary_cta_label: null,
  secondary_cta_label: null,
  is_featured: true,
  sort_order: 0,
};

describe("resolveCommunitySurfaceState", () => {
  it("requires both a persisted active profile and an active rollout", () => {
    expect(
      resolveCommunitySurfaceState({
        profile: ACTIVE_PROFILE,
        isProfileLoading: false,
        isRolloutLoading: false,
        isRolloutActive: true,
      }),
    ).toBe("active");

    expect(
      resolveCommunitySurfaceState({
        profile: ACTIVE_PROFILE,
        isProfileLoading: false,
        isRolloutLoading: false,
        isRolloutActive: false,
      }),
    ).toBe("coming_soon");
  });

  it.each(["launching", "waiting_list", "coming_soon"] as const)(
    "keeps a persisted %s profile in the coming-soon experience",
    (status) => {
      expect(
        resolveCommunitySurfaceState({
          profile: { ...ACTIVE_PROFILE, status },
          isProfileLoading: false,
          isRolloutLoading: false,
          isRolloutActive: true,
        }),
      ).toBe("coming_soon");
    },
  );

  it("does not manufacture a Community from rollout inheritance", () => {
    expect(
      resolveCommunitySurfaceState({
        profile: null,
        isProfileLoading: false,
        isRolloutLoading: false,
        isRolloutActive: true,
      }),
    ).toBe("unavailable");
  });

  it("waits for both sources and fails explicitly on query errors", () => {
    expect(
      resolveCommunitySurfaceState({
        profile: ACTIVE_PROFILE,
        isProfileLoading: false,
        isRolloutLoading: true,
        isRolloutActive: false,
      }),
    ).toBe("loading");
    expect(
      resolveCommunitySurfaceState({
        profile: ACTIVE_PROFILE,
        isProfileLoading: false,
        isRolloutLoading: false,
        isRolloutActive: false,
        hasError: true,
      }),
    ).toBe("error");
  });
});
