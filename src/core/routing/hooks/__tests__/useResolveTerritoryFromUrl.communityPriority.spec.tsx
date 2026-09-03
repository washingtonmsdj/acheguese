import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

const {
  findByPathMock,
  findBySlugAndCityMock,
  findWithMembersMock,
  findGroupsContainingLocationMock,
} = vi.hoisted(() => ({
  findByPathMock: vi.fn(),
  findBySlugAndCityMock: vi.fn(),
  findWithMembersMock: vi.fn(),
  findGroupsContainingLocationMock: vi.fn(),
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: () => ({
    findByPath: findByPathMock,
  }),
}));

vi.mock("@/core/territorial", () => ({
  territorialGroupService: {
    getGroupBySlugAndCity: findBySlugAndCityMock,
    getGroupWithMembers: findWithMembersMock,
    findGroupsContainingLocation: findGroupsContainingLocationMock,
  },
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

  it("resolves the canonical city-level community route as the city location", async () => {
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

      return null;
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador"]}>
        <Routes>
          <Route path="/comunidade/:state/:city" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("location")).toBeInTheDocument());
    expect(findBySlugAndCityMock).not.toHaveBeenCalled();
    expect(findGroupsContainingLocationMock).not.toHaveBeenCalled();
  });

  it("keeps community subpages scoped to the city route params", async () => {
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

      return null;
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador/feed"]}>
        <Routes>
          <Route path="/comunidade/:state/:city/feed" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("location")).toBeInTheDocument());
    expect(findBySlugAndCityMock).not.toHaveBeenCalled();
    expect(findWithMembersMock).not.toHaveBeenCalled();
  });
});