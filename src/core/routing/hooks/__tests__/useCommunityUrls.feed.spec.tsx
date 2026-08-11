import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocationStatus, LocationType } from "@/core/location/types";
import { useCommunityUrls } from "../useCommunityUrls";

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
  useTerritorialContextOptional: () => null,
}));

describe("useCommunityUrls canonical feed URL", () => {
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
});
