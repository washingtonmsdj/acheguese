import { beforeEach, describe, expect, it, vi } from "vitest";
import { selectLooseRows } from "@/integrations/supabase";
import { CommunicationDistributionService } from "../services/CommunicationDistributionService";
import type { CommunicationPublicationDistribution } from "../types";

vi.mock("@/integrations/supabase", () => ({
  selectLooseRows: vi.fn(),
}));

describe("CommunicationDistributionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries the community communication tab by territorial location ids", async () => {
    const mockSelectLooseRows = vi.mocked(selectLooseRows);
    mockSelectLooseRows
      .mockResolvedValueOnce({
        data: [
          {
            id: "dist-1",
            publication_id: "pub-1",
            channel_id: "channel-1",
            location_id: "loc-1",
            target_type: "community_tab",
            is_active: true,
            relevance_score: 60,
            rank_score: 72,
            rank_reason: "territorial:community_tab:news:article:standard_trust",
            created_at: "2026-05-15T10:00:00Z",
            updated_at: "2026-05-15T10:00:00Z",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "pub-1",
            channel_id: "channel-1",
            author_profile_id: "profile-1",
            location_id: "loc-1",
            publication_type: "news",
            content_format: "article",
            title: "Materia local",
            body: "Conteudo completo da materia local.",
            media: {},
            status: "published",
            trust_label: "verified_source",
            published_at: "2026-05-15T10:00:00Z",
            created_at: "2026-05-15T10:00:00Z",
            updated_at: "2026-05-15T10:00:00Z",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "channel-1", slug: "portal-local", public_name: "Portal Local", status: "active" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "loc-1", name: "Nordeste de Amaralina", slug: "nordeste-de-amaralina", type: "district" }],
        error: null,
      });

    const result = await CommunicationDistributionService.listDistributedPublications({
      locationIds: ["loc-1", "loc-2"],
      targetType: "community_tab",
    });

    expect(mockSelectLooseRows).toHaveBeenCalledWith(
      "communication_publication_distribution",
      expect.objectContaining({
        filters: expect.arrayContaining([
          { op: "eq", column: "is_active", value: true },
          { op: "in", column: "location_id", values: ["loc-1", "loc-2"] },
          { op: "eq", column: "target_type", value: "community_tab" },
        ]),
        orderBy: { column: "rank_score", ascending: false },
      }),
    );
    expect(result[0]?.publication?.title).toBe("Materia local");
    expect(result[0]?.channel?.public_name).toBe("Portal Local");
  });

  it("keeps simple updates inline and sends articles to the canonical channel page", () => {
    const distribution = {
      publication: {
        id: "pub-1",
        content_format: "article",
      },
      channel: {
        id: "channel-1",
        slug: "portal-local",
      },
    } as CommunicationPublicationDistribution;

    expect(
      CommunicationDistributionService.resolvePublicationInteraction(distribution, {
        state: "ba",
        city: "salvador",
      }),
    ).toEqual({
      mode: "canonical",
      href: "/comunicacao/ba/salvador/portal-local",
    });

    distribution.publication!.content_format = "update";
    expect(
      CommunicationDistributionService.resolvePublicationInteraction(distribution, {
        state: "ba",
        city: "salvador",
      }),
    ).toEqual({ mode: "inline" });
  });
});
