import { describe, expect, it } from "vitest";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "../utils/communityFeedTab";

describe("community navigation SSOT", () => {
  it("maps launch-enabled public tabs to canonical feed channels", () => {
    expect(resolveCommunityFeedChannelFromTab("empresas")).toBe("empresas");
    expect(resolveCommunityFeedChannelFromTab("desconhecido")).toBe("para_voce");
  });

  it("falls back for paused launch tabs", () => {
    expect(resolveCommunityFeedChannelFromTab("eventos")).toBe("para_voce");
    expect(resolveCommunityFeedChannelFromTab("vagas")).toBe("para_voce");
  });

  it("does not map paused channels back to URL query tabs", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("vagas")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("eventos")).toBeNull();
  });
});
