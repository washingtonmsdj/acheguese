import { describe, expect, it } from "vitest";
import {
  COMMUNITY_FEED_COMPOSER_ACTIONS,
  COMMUNITY_FEED_HEADER_FILTERS,
  COMMUNITY_FEED_SORT_FILTERS,
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "@/core/community/utils/communityFeedTab";

describe("communityFeedTab SSOT", () => {
  it("redirects paused public tabs to para_voce", () => {
    expect(resolveCommunityFeedChannelFromTab("vagas")).toBe("para_voce");
    expect(resolveCommunityFeedChannelFromTab("eventos")).toBe("para_voce");
    expect(resolveCommunityFeedChannelFromTab("alertas")).toBe("para_voce");
  });

  it("defaults unknown tab to para_voce", () => {
    expect(resolveCommunityFeedChannelFromTab("desconhecido")).toBe(
      "para_voce",
    );
  });

  it("does not emit query tabs for paused channels", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("oportunidades")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("vagas")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("eventos")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("alertas")).toBeNull();
  });

  it("returns null for para_voce and unsupported channels", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("moradores")).toBeNull();
  });

  it("keeps only launch-enabled header filters", () => {
    expect(COMMUNITY_FEED_HEADER_FILTERS).toEqual([
      { id: "para_voce", label: "Para voce" },
      { id: "empresas", label: "Empresas" },
    ]);
  });

  it("keeps sort filter order stable", () => {
    expect(COMMUNITY_FEED_SORT_FILTERS).toEqual([
      { id: "popular", label: "Melhores" },
      { id: "recent", label: "Recentes" },
      { id: "most_commented", label: "Comentados" },
    ]);
  });

  it("keeps only launch-enabled composer actions", () => {
    expect(COMMUNITY_FEED_COMPOSER_ACTIONS).toEqual([
      { id: "text", label: "Texto" },
      { id: "media", label: "Foto/video" },
      { id: "poll", label: "Enquete" },
      { id: "file", label: "Arquivo" },
    ]);
  });
});
