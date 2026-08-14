import { describe, expect, it } from "vitest";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "../utils/communityFeedTab";

describe("community navigation SSOT", () => {
  it("maps launch-enabled public tabs to canonical feed channels", () => {
    expect(resolveCommunityFeedChannelFromTab("empresas")).toBe("empresas");
    expect(resolveCommunityFeedChannelFromTab("desconhecido")).toBe(
      "para_voce",
    );
  });

  it("maps active launch tabs to their canonical channels", () => {
    expect(resolveCommunityFeedChannelFromTab("eventos")).toBe("eventos");
    expect(resolveCommunityFeedChannelFromTab("vagas")).toBe("oportunidades");
  });

  it("maps active channels back to canonical URL query tabs", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("vagas")).toBe(
      "oportunidades",
    );
    expect(resolveCommunityFeedQueryTabFromChannel("eventos")).toBe("eventos");
  });
});
