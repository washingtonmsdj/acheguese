import { describe, expect, it } from "vitest";
import {
  COMMUNITY_FEED_COMPOSER_ACTIONS,
  COMMUNITY_FEED_HEADER_FILTERS,
  COMMUNITY_FEED_SORT_FILTERS,
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "@/core/community/utils/communityFeedTab";

describe("communityFeedTab SSOT", () => {
  it("maps vagas tab to oportunidades channel", () => {
    expect(resolveCommunityFeedChannelFromTab("vagas")).toBe("oportunidades");
  });

  it("defaults unknown tab to para_voce", () => {
    expect(resolveCommunityFeedChannelFromTab("desconhecido")).toBe("para_voce");
  });

  it("maps opportunities and vagas channels back to oportunidades query tab", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("oportunidades")).toBe("oportunidades");
    expect(resolveCommunityFeedQueryTabFromChannel("vagas")).toBe("oportunidades");
  });

  it("returns null for para_voce and unsupported channels", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("moradores")).toBeNull();
  });

  it("keeps header filter order and labels aligned with unified feed tabs", () => {
    expect(COMMUNITY_FEED_HEADER_FILTERS).toEqual([
      { id: "para_voce", label: "Para você" },
      { id: "alertas", label: "Alertas" },
      { id: "empresas", label: "Empresas" },
      { id: "eventos", label: "Eventos" },
      { id: "oportunidades", label: "Oportunidades" },
    ]);
  });

  it("keeps sort filter order stable", () => {
    expect(COMMUNITY_FEED_SORT_FILTERS).toEqual([
      { id: "recent", label: "Recentes" },
      { id: "popular", label: "Em alta" },
      { id: "most_commented", label: "Comentados" },
    ]);
  });

  it("keeps composer actions stable", () => {
    expect(COMMUNITY_FEED_COMPOSER_ACTIONS).toEqual([
      { id: "text", label: "Texto" },
      { id: "media", label: "Foto/vídeo" },
      { id: "poll", label: "Enquete" },
      { id: "alert", label: "Aviso" },
      { id: "file", label: "Arquivo" },
    ]);
  });
});
