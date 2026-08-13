import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocationStatus, LocationType } from "@/core/location/types";
import type { TerritorialLayoutContext } from "@/core/routing/components/TerritorialLayout";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useCommunityUrls } from "../useCommunityUrls";

const territorialContextState = vi.hoisted(() => ({
  current: null as TerritorialLayoutContext | null,
}));

vi.mock("@/core/location/hooks/useActiveTerritory", () => ({
  useActiveTerritory: () => ({
    activeLocation: {
      id: "location-pituba",
      parent_id: "location-salvador",
      type: LocationType.DISTRICT,
      slug: "pituba",
      name: "Pituba",
      full_name: "Pituba, Salvador",
      geographic_path: "/br/ba/salvador/pituba",
      status: LocationStatus.ACTIVE,
      metadata: {},
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  }),
}));

vi.mock("@/core/routing/components/TerritorialLayout", () => ({
  useTerritorialContextOptional: () => territorialContextState.current,
}));

const cityResolved: Exclude<ResolvedTerritory, null> = {
  kind: "location",
  location: {
    id: "location-salvador",
    parent_id: "location-ba",
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, BA",
    geographic_path: "/br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

describe("useCommunityUrls canonical feed URL", () => {
  beforeEach(() => {
    territorialContextState.current = null;
  });

  it("keeps the community base distinct from the explicit full-feed entrypoint", () => {
    const { result } = renderHook(() => useCommunityUrls());

    expect(result.current.feed).toBe("/comunidade/ba/salvador/pituba/feed");
    expect(result.current.alerts).toBe(
      "/comunidade/ba/salvador/pituba/feed?tab=alertas",
    );
    expect(result.current.issues).toBe(
      "/comunidade/ba/salvador/pituba/problemas",
    );
    expect(result.current.groups).toBe("/comunidade/ba/salvador/pituba/grupos");
  });

  it("builds the Salvador feed from the community root supplied by the shell", () => {
    territorialContextState.current = {
      resolved: cityResolved,
      baseUrl: "/ba/salvador",
      communityBaseUrl: "/comunidade/ba/salvador",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    const { result } = renderHook(() => useCommunityUrls(cityResolved));

    expect(result.current.feed).toBe("/comunidade/ba/salvador/feed");
    expect(result.current.feed).not.toContain("/feed/feed");
  });

  it("keeps feed composition idempotent when called repeatedly", () => {
    territorialContextState.current = {
      resolved: cityResolved,
      baseUrl: "/ba/salvador",
      communityBaseUrl: "/comunidade/ba/salvador/feed",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    const { result, rerender } = renderHook(() => useCommunityUrls(cityResolved));
    rerender();

    expect(result.current.feed).toBe("/comunidade/ba/salvador/feed");
    expect(result.current.alerts).toBe(
      "/comunidade/ba/salvador/feed?tab=alertas",
    );
  });
});
