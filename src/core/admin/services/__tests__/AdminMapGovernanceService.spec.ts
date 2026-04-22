import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminMapGovernanceService } from "../AdminMapGovernanceService";

const updateMetadataFlagMock = vi.fn();
const getLocationByIdMock = vi.fn();
const updateLocationMock = vi.fn();
const geocodeMock = vi.fn();

vi.mock("@/core/territorial", () => ({
  TerritorialManagementService: {
    updateMetadataFlag: (...args: unknown[]) => updateMetadataFlagMock(...args),
    fetchTerritoryTree: vi.fn(),
  },
}));

vi.mock("@/core/location", () => ({
  locationAdminService: {
    listLocations: vi.fn(),
    getLocationById: (...args: unknown[]) => getLocationByIdMock(...args),
    updateLocation: (...args: unknown[]) => updateLocationMock(...args),
  },
  locationGeocodingService: {
    geocode: (...args: unknown[]) => geocodeMock(...args),
  },
}));

vi.mock("@/core/maps", () => ({
  DEFAULT_CAMERA: { center: [-43.2, -22.9], zoom: 11 },
  DEFAULT_TILE_STYLE: { styleUrl: "https://tile.example.com/style" },
  MAP_PRODUCT_SURFACES: [],
  MAP_RUNTIME_LAYER_KEYS: [],
}));

vi.mock("@/core/maps/config/markerConfig", () => ({
  getLayerConfig: () => ({ label: "Layer" }),
}));

vi.mock("@/modules/guide/tourist-points", () => ({
  CATEGORY_LABELS: {},
  TouristPointService: {
    list: vi.fn(),
  },
  TouristPointStatus: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    ARCHIVED: "archived",
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("AdminMapGovernanceService.resolveHotspot", () => {
  beforeEach(() => {
    updateMetadataFlagMock.mockReset();
    getLocationByIdMock.mockReset();
    updateLocationMock.mockReset();
    geocodeMock.mockReset();
  });

  it("enables selector for location hotspots", async () => {
    updateMetadataFlagMock.mockResolvedValueOnce(null);

    const result = await adminMapGovernanceService.resolveHotspot({
      id: "location:1:selector_hidden",
      entityKind: "location",
      entityId: "loc-1",
      issue: "selector_hidden",
      name: "Centro",
    });

    expect(updateMetadataFlagMock).toHaveBeenCalledWith(
      "locations",
      "loc-1",
      "is_selector_active",
      true,
    );
    expect(result.action).toBe("enabled_selector");
  });

  it("enables route for group hotspots", async () => {
    updateMetadataFlagMock.mockResolvedValueOnce(null);

    const result = await adminMapGovernanceService.resolveHotspot({
      id: "group:1:route_disabled",
      entityKind: "group",
      entityId: "group-1",
      issue: "route_disabled",
      name: "Zona Sul",
    });

    expect(updateMetadataFlagMock).toHaveBeenCalledWith(
      "territorial_groups",
      "group-1",
      "is_navigable",
      true,
    );
    expect(result.action).toBe("enabled_route");
  });

  it("reconciles coordinates for missing coordinates hotspot", async () => {
    getLocationByIdMock.mockResolvedValueOnce({
      id: "loc-2",
      name: "Florianopolis",
      full_name: "Florianopolis, Santa Catarina",
      metadata: { coordinates_needs_refinement: true },
    });
    geocodeMock.mockResolvedValueOnce([
      {
        coordinates: { latitude: -27.5949, longitude: -48.5482 },
        source: "nominatim",
      },
    ]);
    updateLocationMock.mockResolvedValueOnce(null);

    const result = await adminMapGovernanceService.resolveHotspot({
      id: "location:2:missing_coordinates",
      entityKind: "location",
      entityId: "loc-2",
      issue: "missing_coordinates",
      name: "Florianopolis",
    });

    expect(geocodeMock).toHaveBeenCalledWith({
      query: "Florianopolis, Santa Catarina",
      country: "BR",
      limit: 1,
    });
    expect(updateLocationMock).toHaveBeenCalledWith(
      "loc-2",
      expect.objectContaining({
        metadata: expect.objectContaining({
          center_latitude: -27.5949,
          center_longitude: -48.5482,
          coordinates_source: "nominatim",
          coordinates_confidence: "high",
          coordinates_needs_refinement: false,
        }),
      }),
    );
    expect(result.action).toBe("reconciled_coordinates");
  });

  it("throws for group without members", async () => {
    await expect(
      adminMapGovernanceService.resolveHotspot({
        id: "group:3:group_without_members",
        entityKind: "group",
        entityId: "group-3",
        issue: "group_without_members",
        name: "Grupo vazio",
      }),
    ).rejects.toThrow("Grupo sem membros exige curadoria estrutural");
  });
});

