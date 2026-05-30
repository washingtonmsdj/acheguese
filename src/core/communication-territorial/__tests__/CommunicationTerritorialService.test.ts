import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("expands city hub scope to the city and child territories", async () => {
    const listLocationsSpy = vi.spyOn(CommunicationTerritorialService, "listLocations").mockResolvedValue([
      {
        id: "city-1",
        name: "Salvador",
        full_name: "Salvador",
        slug: "salvador",
        type: "city",
        parent_id: null,
      },
      {
        id: "loc-a",
        name: "A",
        full_name: "A",
        slug: "a",
        type: "district",
        parent_id: "city-1",
      },
      {
        id: "loc-b",
        name: "B",
        full_name: "B",
        slug: "b",
        type: "district",
        parent_id: "city-1",
      },
    ]);
    const listActiveChannelsSpy = vi
      .spyOn(CommunicationTerritorialService, "listActiveChannels")
      .mockResolvedValue([]);
    const listPublicationsSpy = vi
      .spyOn(CommunicationTerritorialService, "listPublications")
      .mockResolvedValue([]);

    const result = await CommunicationTerritorialService.getPublicHub({
      state: "ba",
      city: "salvador",
    });

    expect(listLocationsSpy).toHaveBeenCalled();
    expect(listActiveChannelsSpy).toHaveBeenCalledWith(["city-1", "loc-a", "loc-b"]);
    expect(listPublicationsSpy).toHaveBeenCalledWith({ locationIds: ["city-1", "loc-a", "loc-b"], limit: 40 });
    expect(result.title).toBe("Comunicacao em Salvador");
  });
});
