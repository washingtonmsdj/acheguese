import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCommunityScopeResolver } from "@/core/community/hooks/useCommunityScopeResolver";

const useResolveTerritoryFromUrlMock = vi.fn();

vi.mock("@/core/routing/hooks/useResolveTerritoryFromUrl", () => ({
  useResolveTerritoryFromUrl: () => useResolveTerritoryFromUrlMock(),
}));

function Probe() {
  const { resolvedScope } = useCommunityScopeResolver();
  return <div>{resolvedScope ? resolvedScope.scope_type : "null"}</div>;
}

describe("useCommunityScopeResolver", () => {
  it("does not accept city as community scope", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_location",
      error: null,
      resolved: {
        kind: "location",
        location: {
          id: "city-1",
          type: "city",
        },
      },
    });

    render(<Probe />);
    expect(screen.getByText("null")).toBeInTheDocument();
  });

  it("resolves district scope", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_location",
      error: null,
      resolved: {
        kind: "location",
        location: {
          id: "district-1",
          type: "district",
        },
      },
    });

    render(<Probe />);
    expect(screen.getByText("district")).toBeInTheDocument();
  });

  it("resolves territorial_group scope", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_group",
      error: null,
      resolved: {
        kind: "group",
        group: {
          id: "group-1",
        },
      },
    });

    render(<Probe />);
    expect(screen.getByText("territorial_group")).toBeInTheDocument();
  });
});

