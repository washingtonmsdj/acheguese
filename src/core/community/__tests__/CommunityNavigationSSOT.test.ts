import { describe, expect, it } from "vitest";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
} from "../utils/communityFeedTab";

describe("community navigation SSOT", () => {
  it("maps public tabs to canonical feed channels", () => {
    expect(resolveCommunityFeedChannelFromTab("empresas")).toBe("empresas");
    expect(resolveCommunityFeedChannelFromTab("eventos")).toBe("eventos");
    expect(resolveCommunityFeedChannelFromTab("vagas")).toBe("oportunidades");
    expect(resolveCommunityFeedChannelFromTab("desconhecido")).toBe("para_voce");
  });

  it("maps channels back to URL query tabs without duplicating vacancies", () => {
    expect(resolveCommunityFeedQueryTabFromChannel("para_voce")).toBeNull();
    expect(resolveCommunityFeedQueryTabFromChannel("vagas")).toBe("oportunidades");
  });
});
