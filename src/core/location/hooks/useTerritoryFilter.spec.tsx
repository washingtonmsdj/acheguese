import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTerritoryFilter } from "./useTerritoryFilter";
import { useActiveTerritory } from "./useActiveTerritory";
import { useLocationContext } from "./useLocationContext";
import { useUserTerritory } from "./useUserTerritory";

vi.mock("./useLocationContext", () => ({
  useLocationContext: vi.fn(),
}));

vi.mock("./useActiveTerritory", () => ({
  useActiveTerritory: vi.fn(),
}));

vi.mock("./useUserTerritory", () => ({
  useUserTerritory: vi.fn(),
}));

describe("useTerritoryFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLocationContext).mockReturnValue({
      activeTerritory: null,
    } as never);
    vi.mocked(useActiveTerritory).mockReturnValue({
      territoryMode: null,
    } as never);
    vi.mocked(useUserTerritory).mockReturnValue({
      hasHome: false,
      homeDistrict: null,
      homeCity: null,
    } as never);
  });

  it("prioriza a localizacao explicita da URL sobre o modo territorial do usuario", () => {
    vi.mocked(useActiveTerritory).mockReturnValue({
      territoryMode: "bairro",
    } as never);
    vi.mocked(useUserTerritory).mockReturnValue({
      hasHome: true,
      homeDistrict: { id: "home-district" },
      homeCity: { id: "home-city" },
    } as never);

    const routeResolved = {
      kind: "location",
      location: {
        id: "route-district",
        parent_id: "home-city",
      },
    } as never;

    const { result } = renderHook(() => useTerritoryFilter(routeResolved));

    expect(result.current).toEqual({
      scope: "location",
      location_id: "route-district",
    });
  });

  it("mantem grupo explicito da rota como prioridade maxima", () => {
    const routeResolved = {
      kind: "group",
      group: {
        members: [{ id: "loc-1" }, { id: "loc-2" }],
      },
    } as never;

    const { result } = renderHook(() =>
      useTerritoryFilter(routeResolved, ["loc-2"]),
    );

    expect(result.current).toEqual({
      scope: "group",
      location_ids: ["loc-2"],
    });
  });

  it("usa o modo cidade do usuario apenas fora de rota territorial explicita", () => {
    vi.mocked(useActiveTerritory).mockReturnValue({
      territoryMode: "cidade",
    } as never);
    vi.mocked(useUserTerritory).mockReturnValue({
      hasHome: true,
      homeDistrict: { id: "home-district" },
      homeCity: { id: "home-city" },
    } as never);

    const { result } = renderHook(() => useTerritoryFilter());

    expect(result.current).toEqual({
      scope: "location",
      location_id: "home-city",
    });
  });
});
