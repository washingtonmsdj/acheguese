import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BuscarPage from "../BuscarPage";

const searchMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("@/core/ai", async () => {
  const actual = await vi.importActual<typeof import("@/core/ai")>("@/core/ai");

  return {
    ...actual,
    AISearchResults: ({
      error,
      loading,
    }: {
      error?: string | null;
      loading?: boolean;
    }) => (
      <div data-testid="ai-results">
        {loading ? "loading" : (error ?? "results")}
      </div>
    ),
    useAISearch: () => ({
      result: null,
      loading: false,
      error: null,
      search: searchMock,
    }),
  };
});

vi.mock("@/core/location/hooks/useModuleTerritoryFilter", () => ({
  useModuleTerritoryFilter: () => ({
    resolvedLocationIds: ["loc-nordeste", "loc-amaralina"],
    territoryFilter: {
      scope: "group",
      location_ids: ["loc-nordeste", "loc-amaralina"],
    },
    source: "url",
    displayLabel: "Complexo do Nordeste de Amaralina",
    location: null,
    centerCoords: {
      latitude: -13.009,
      longitude: -38.457,
    },
    isLoading: false,
  }),
}));

vi.mock("@/core/location/hooks/useUserTerritory", () => ({
  useUserTerritory: () => ({
    homeDistrict: null,
    homeCity: null,
    loading: false,
  }),
}));

vi.mock("@/core/routing/hooks/useResolveTerritoryFromUrl", () => ({
  TERRITORY_RESOLVE_STATUS: {
    IDLE: "idle",
    LOADING: "loading",
    RESOLVED_LOCATION: "resolved_location",
    RESOLVED_GROUP: "resolved_group",
    NOT_FOUND: "not_found",
    INACTIVE: "inactive",
    RESTRICTED: "restricted",
    ERROR: "error",
  },
  useResolveTerritoryFromUrl: () => ({
    status: "resolved_group",
    resolved: {
      kind: "group",
      group: {
        id: "group-nordeste",
        name: "Complexo do Nordeste de Amaralina",
        slug: "complexo-do-nordeste-de-amaralina",
        members: [],
      },
    },
    error: null,
  }),
}));

function renderSearchPage(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/busca/:state/:city/:district" element={<BuscarPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BuscarPage", () => {
  beforeEach(() => {
    searchMock.mockClear();
  });

  it("hydrates q from the URL and searches inside the resolved community territory", async () => {
    renderSearchPage(
      "/busca/ba/salvador/complexo-do-nordeste-de-amaralina?q=pizzaria",
    );

    expect(screen.getByLabelText("Busca inteligente")).toHaveValue("pizzaria");
    expect(
      screen.getByText("Procurando em: Complexo do Nordeste de Amaralina"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith("pizzaria", {
        locationId: undefined,
        territoryFilter: {
          scope: "group",
          location_ids: ["loc-nordeste", "loc-amaralina"],
        },
        territoryLabel: "Complexo do Nordeste de Amaralina",
        coordinates: {
          latitude: -13.009,
          longitude: -38.457,
        },
      });
    });
  });
});
