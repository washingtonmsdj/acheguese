import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useModuleTerritoryFilter } from "./useModuleTerritoryFilter";
import { useResolvedUserLocation } from "./useResolvedUserLocation";
import { useUserTerritory } from "./useUserTerritory";
import { createLocationRepository } from "../repositories/createLocationRepository";

vi.mock("./useUserTerritory", () => ({
  useUserTerritory: vi.fn(),
}));

vi.mock("./useResolvedUserLocation", () => ({
  useResolvedUserLocation: vi.fn(),
}));

vi.mock("../repositories/createLocationRepository", () => ({
  createLocationRepository: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}

describe("useModuleTerritoryFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useUserTerritory).mockReturnValue({
      loading: false,
      hasHome: false,
      homeDistrict: null,
      homeCity: null,
    } as never);

    vi.mocked(useResolvedUserLocation).mockReturnValue({
      isLoading: false,
      coords: null,
      location: null,
    } as never);

    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockResolvedValue(null),
      findDescendants: vi.fn().mockResolvedValue({ locations: [] }),
    } as never);
  });

  it("respeita activeMemberIds quando a rota resolve um grupo territorial", () => {
    const loc1 = "11111111-1111-4111-8111-111111111111";
    const loc2 = "22222222-2222-4222-8222-222222222222";
    const loc3 = "33333333-3333-4333-8333-333333333333";
    const routeResolved = {
      kind: "group",
      group: {
        id: "group-1",
        name: "Complexo Teste",
        members: [{ id: loc1 }, { id: loc2 }, { id: loc3 }],
      },
    } as never;

    const { result } = renderHook(
      () =>
        useModuleTerritoryFilter({
          routeResolved,
          activeMemberIds: [loc2],
          nearbyEnabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.resolvedLocationIds).toEqual([loc2]);
    expect(result.current.territoryFilter).toEqual({
      scope: "location",
      location_id: loc2,
    });
    expect(result.current.source).toBe("url");
  });
});
