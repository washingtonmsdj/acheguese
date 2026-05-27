import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

const findByPathMock = vi.fn();
const findBySlugAndCityMock = vi.fn();
const findWithMembersMock = vi.fn();
const findGroupsContainingLocationMock = vi.fn();

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: () => ({
    findByPath: findByPathMock,
  }),
}));

vi.mock("@/core/location/repositories/createTerritorialGroupRepository", () => ({
  createTerritorialGroupRepository: () => ({
    findBySlugAndCity: findBySlugAndCityMock,
    findWithMembers: findWithMembersMock,
    findGroupsContainingLocation: findGroupsContainingLocationMock,
  }),
}));

function Probe() {
  const result = useResolveTerritoryFromUrl();
  const text =
    result.status === "resolved_group"
      ? "group"
      : result.status === "resolved_location"
        ? "location"
        : result.status;
  return <div>{text}</div>;
}

describe("useResolveTerritoryFromUrl community priority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findGroupsContainingLocationMock.mockResolvedValue([]);
  });

  it("promotes district slug to territorial group in /comunidade when membership is unique", async () => {
    findByPathMock.mockImplementation(async (path: string) => {
      if (path === "/br/ba/salvador") {
        return {
          id: "city-1",
          name: "Salvador",
          slug: "salvador",
          type: "city",
          parent_id: "state-1",
          geographic_path: "/br/ba/salvador",
          status: "active",
          metadata: { is_navigable: true },
        };
      }

      if (path === "/br/ba/salvador/chapada-do-rio-vermelho") {
        return {
          id: "district-1",
          name: "Chapada do Rio Vermelho",
          slug: "chapada-do-rio-vermelho",
          type: "district",
          parent_id: "city-1",
          geographic_path: path,
          status: "active",
          metadata: { is_navigable: true },
        };
      }

      return null;
    });

    findBySlugAndCityMock.mockResolvedValue(null);

    findGroupsContainingLocationMock.mockResolvedValue([
      {
        id: "group-1",
        name: "Complexo do Nordeste",
        slug: "complexo-do-nordeste-de-amaralina",
        anchor_city_id: "city-1",
        status: "active",
        metadata: { is_navigable: true },
      },
    ]);

    findWithMembersMock.mockResolvedValue({
      id: "group-1",
      name: "Complexo do Nordeste",
      slug: "complexo-do-nordeste-de-amaralina",
      anchor_city_id: "city-1",
      status: "active",
      metadata: { is_navigable: true },
      members: [],
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador/chapada-do-rio-vermelho"]}>
        <Routes>
          <Route path="/comunidade/:state/:city/:groupSlugOrDistrict" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("group")).toBeInTheDocument());
  });

  it("resolves group before district for /comunidade/:state/:city/:territorySlug", async () => {
    findByPathMock.mockImplementation(async (path: string) => {
      if (path === "/br/ba/salvador") {
        return {
          id: "city-1",
          name: "Salvador",
          slug: "salvador",
          type: "city",
          parent_id: "state-1",
          geographic_path: "/br/ba/salvador",
          status: "active",
          metadata: { is_navigable: true },
        };
      }

      if (path === "/br/ba/salvador/nordeste-de-amaralina") {
        return {
          id: "district-1",
          name: "Nordeste de Amaralina",
          slug: "nordeste-de-amaralina",
          type: "district",
          parent_id: "city-1",
          geographic_path: path,
          status: "active",
          metadata: { is_navigable: true },
        };
      }

      return null;
    });

    findBySlugAndCityMock.mockResolvedValue({
      id: "group-1",
      name: "Nordeste Expandido",
      slug: "nordeste-de-amaralina",
      status: "active",
      metadata: { is_navigable: true },
    });

    findWithMembersMock.mockResolvedValue({
      id: "group-1",
      name: "Nordeste Expandido",
      slug: "nordeste-de-amaralina",
      status: "active",
      metadata: { is_navigable: true },
      members: [],
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador/nordeste-de-amaralina"]}>
        <Routes>
          <Route path="/comunidade/:state/:city/:groupSlugOrDistrict" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("group")).toBeInTheDocument());
  });
});
