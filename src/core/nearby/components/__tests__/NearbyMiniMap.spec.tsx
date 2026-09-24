import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NearbyMiniMap } from "../NearbyMiniMap";

vi.mock("@/core/maps", () => ({
  mapEntityProjection: {
    projectBusiness: (business: { id: string }) => ({
      id: business.id,
      type: "business",
    }),
  },
}));

vi.mock("@/core/maps/components/v3/MapLibreAdapter", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    MapLibreAdapter: React.forwardRef(function MockMapLibreAdapter(
      {
        markers = [],
        onMarkerClick,
      }: {
        markers?: Array<{ id: string }>;
        onMarkerClick?: (id: string) => void;
      },
      _ref,
    ) {
      return (
        <div>
          {markers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onClick={() => onMarkerClick?.(marker.id)}
            >
              {"Abrir empresa " + marker.id}
            </button>
          ))}
        </div>
      );
    }),
  };
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe("NearbyMiniMap", () => {
  it("opens a business marker through its canonical Business URL", () => {
    render(
      <MemoryRouter initialEntries={["/perto-de-mim/ba/salvador/pituba"]}>
        <NearbyMiniMap
          userLocation={{ latitude: -13.003, longitude: -38.458 }}
          businesses={[
            {
              id: "business-1",
              name: "Pizzaria Central",
              category: "restaurant",
              distanceMeters: 120,
              latitude: -13.004,
              longitude: -38.459,
              canonicalUrl:
                "/empresas/ba/salvador/pituba/pizzaria-central",
              rating: 4.8,
              verified: true,
            },
          ]}
          radiusKm={5}
          showProximity
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir empresa business-1" }),
    );

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/empresas/ba/salvador/pituba/pizzaria-central",
    );
  });
});
