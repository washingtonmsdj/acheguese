import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerritorialGroupService } from "@/core/location/services/TerritorialGroupService";
import { selectLooseRows } from "@/integrations/supabase/services/supabaseHelpers";
import { CommunicationTerritorialService } from "../services/CommunicationTerritorialService";

vi.mock("@/integrations/supabase/services/supabaseHelpers", () => ({
  selectLooseRows: vi.fn(),
}));

describe("CommunicationTerritorialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies location_id filter when listing publications", async () => {
    const mockSelectLooseRows = vi.mocked(selectLooseRows);
    mockSelectLooseRows.mockResolvedValue({ data: [], error: null });

    await CommunicationTerritorialService.listPublications({
      locationIds: ["loc-1", "loc-2"],
      limit: 10,
    });

    expect(mockSelectLooseRows).toHaveBeenCalledWith(
      "communication_publications",
      expect.objectContaining({
        filters: expect.arrayContaining([
          { op: "eq", column: "status", value: "published" },
          { op: "in", column: "location_id", values: ["loc-1", "loc-2"] },
        ]),
        limit: 10,
      }),
    );
  });

  it("expands territorial group members before querying hub publications", async () => {
    const listLocationsSpy = vi.spyOn(CommunicationTerritorialService, "listLocations").mockResolvedValue([
      {
        id: "city-1",
        name: "Salvador",
        full_name: "Salvador",
        slug: "salvador",
        type: "city",
        parent_id: null,
      },
    ]);
    const listActiveChannelsSpy = vi
      .spyOn(CommunicationTerritorialService, "listActiveChannels")
      .mockResolvedValue([]);
    const listPublicationsSpy = vi
      .spyOn(CommunicationTerritorialService, "listPublications")
      .mockResolvedValue([]);

    vi.spyOn(TerritorialGroupService.prototype, "findBySlugAndCity").mockResolvedValue({
      id: "group-1",
      name: "Complexo",
      slug: "complexo",
      status: "active",
    } as never);
    vi.spyOn(TerritorialGroupService.prototype, "listMembers").mockResolvedValue([
      { id: "loc-a", name: "A" },
      { id: "loc-b", name: "B" },
      { id: "loc-a", name: "A repetido" },
    ] as never);

    const result = await CommunicationTerritorialService.getPublicHub({
      state: "ba",
      city: "salvador",
      territorySlug: "complexo",
    });

    expect(listLocationsSpy).toHaveBeenCalled();
    expect(listActiveChannelsSpy).toHaveBeenCalledWith(["loc-a", "loc-b"]);
    expect(listPublicationsSpy).toHaveBeenCalledWith({ locationIds: ["loc-a", "loc-b"], limit: 40 });
    expect(result.title).toBe("Comunicacao em Complexo");
  });
});
