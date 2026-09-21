import { describe, expect, it } from "vitest";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "@/core/community-feed/utils/communityFeedTab";

describe("community navigation SSOT", () => {
  it("falls back to para_voce while Community feed channels are paused", () => {
    for (const tab of [
      "empresas",
      "eventos",
      "vagas",
      "oportunidades",
      "alertas",
      "desconhecido",
    ]) {
      expect(resolveCommunityFeedChannelFromTab(tab), tab).toBe("para_voce");
    }
  });

  it("does not expose query tabs for paused channels", () => {
    for (const channel of [
      "empresas",
      "eventos",
      "vagas",
      "oportunidades",
      "alertas",
    ] as const) {
      expect(resolveCommunityFeedQueryTabFromChannel(channel), channel).toBeNull();
    }
  });

  it("keeps para_voce canonical without a query tab", () => {
    expect(resolveCommunityFeedChannelFromTab("para_voce")).toBe("para_voce");
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
  });
});
