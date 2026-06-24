import { describe, expect, it } from "vitest";

import {
  filterLaunchItems,
  filterLaunchSections,
  isLaunchBusinessCategoryEnabled,
  isLaunchClassifiedCategoryEnabled,
  isLaunchCommunityFeedChannelEnabled,
  isLaunchCommunityPostEnabled,
  isLaunchNavItemEnabled,
  isLaunchSurfaceEnabled,
} from "../launchScope";

describe("launchScope", () => {
  it("keeps MVP public surfaces enabled and paused surfaces disabled", () => {
    expect(isLaunchSurfaceEnabled("map")).toBe(true);
    expect(isLaunchSurfaceEnabled("nearby")).toBe(true);
    expect(isLaunchSurfaceEnabled("community")).toBe(true);
    expect(isLaunchSurfaceEnabled("classifieds")).toBe(true);

    expect(isLaunchSurfaceEnabled("jobs")).toBe(false);
    expect(isLaunchSurfaceEnabled("events")).toBe(false);
    expect(isLaunchSurfaceEnabled("mobility")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityAlerts")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityIssues")).toBe(false);
  });

  it("filters navigation items and removes empty sections", () => {
    expect(isLaunchNavItemEnabled("map")).toBe(true);
    expect(isLaunchNavItemEnabled("nearby")).toBe(true);
    expect(isLaunchNavItemEnabled("jobs")).toBe(false);

    expect(
      filterLaunchItems([
        { id: "map", label: "Mapa" },
        { id: "jobs", label: "Vagas" },
        { id: "nearby", label: "Perto de Mim" },
      ]),
    ).toEqual([
      { id: "map", label: "Mapa" },
      { id: "nearby", label: "Perto de Mim" },
    ]);

    expect(
      filterLaunchSections([
        { label: "Ativas", items: [{ id: "map" }] },
        { label: "Pausadas", items: [{ id: "jobs" }, { id: "events" }] },
      ]),
    ).toEqual([{ label: "Ativas", items: [{ id: "map" }] }]);
  });

  it("hides jobs-only classified categories", () => {
    expect(isLaunchClassifiedCategoryEnabled("vagas")).toBe(false);
    expect(isLaunchClassifiedCategoryEnabled("imoveis")).toBe(true);
  });

  it("hides paused business categories", () => {
    expect(isLaunchBusinessCategoryEnabled("educacao")).toBe(false);
    expect(isLaunchBusinessCategoryEnabled("restaurante")).toBe(true);
  });

  it("hides paused community feed channels and post formats", () => {
    expect(isLaunchCommunityFeedChannelEnabled("geral")).toBe(true);
    expect(isLaunchCommunityFeedChannelEnabled("eventos")).toBe(false);
    expect(isLaunchCommunityFeedChannelEnabled("vagas")).toBe(false);

    expect(isLaunchCommunityPostEnabled({ content_intent: "duvida" })).toBe(true);
    expect(isLaunchCommunityPostEnabled({ content_intent: "alerta_urgente" })).toBe(false);
    expect(isLaunchCommunityPostEnabled({ display_format: "event_card" })).toBe(false);
    expect(isLaunchCommunityPostEnabled({ type: "oportunidade" })).toBe(false);
    expect(
      isLaunchCommunityPostEnabled({
        distribution_channels: ["geral", "eventos"],
      }),
    ).toBe(false);
  });
});
