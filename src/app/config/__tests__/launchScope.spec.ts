import { describe, expect, it } from "vitest";

import { ACTIVE_MODULES, getContextMessageFromPath } from "../modules";
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
    expect(isLaunchSurfaceEnabled("communityEventsPreview")).toBe(true);

    expect(isLaunchSurfaceEnabled("jobs")).toBe(true);
    expect(isLaunchSurfaceEnabled("events")).toBe(true);
    expect(isLaunchSurfaceEnabled("education")).toBe(false);
    expect(isLaunchSurfaceEnabled("billing")).toBe(false);
    expect(isLaunchSurfaceEnabled("mobility")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityAlerts")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityIssues")).toBe(false);
  });

  it("filters navigation items and removes empty sections", () => {
    expect(isLaunchNavItemEnabled("map")).toBe(true);
    expect(isLaunchNavItemEnabled("nearby")).toBe(true);
    expect(isLaunchNavItemEnabled("jobs")).toBe(true);

    expect(
      filterLaunchItems([
        { id: "map", label: "Mapa" },
        { id: "jobs", label: "Vagas" },
        { id: "nearby", label: "Perto de Mim" },
      ]),
    ).toEqual([
      { id: "map", label: "Mapa" },
      { id: "jobs", label: "Vagas" },
      { id: "nearby", label: "Perto de Mim" },
    ]);

    expect(
      filterLaunchSections([
        { label: "Ativas", items: [{ id: "map" }] },
        { label: "Pausadas", items: [{ id: "education" }, { id: "mobility" }] },
      ]),
    ).toEqual([{ label: "Ativas", items: [{ id: "map" }] }]);
  });


  it("keeps the global module registry aligned with launch scope", () => {
    const activeIds = ACTIVE_MODULES.map((module) => module.id);

    expect(activeIds).toContain("business");
    expect(activeIds).toContain("gastronomy");
    expect(activeIds).toContain("community-events");
    expect(activeIds).not.toContain("mobility");
    expect(activeIds).not.toContain("education");
    expect(activeIds).not.toContain("ranking");
    expect(activeIds).not.toContain("community-alerts");
    expect(activeIds).not.toContain("community-issues");
    expect(activeIds).not.toContain("community-lost-found");
  });

  it("does not expose paused module context in territory chrome", () => {
    expect(getContextMessageFromPath("/mobilidade")).toBeNull();
    expect(getContextMessageFromPath("/educacao/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/ranking")).toBeNull();

    expect(getContextMessageFromPath("/empresas/ba/salvador")).toBe(
      "Exibindo empresas de",
    );
  });

  it("keeps jobs classified categories aligned with the active launch surface", () => {
    expect(isLaunchClassifiedCategoryEnabled("vagas")).toBe(true);
    expect(isLaunchClassifiedCategoryEnabled("imoveis")).toBe(true);
  });

  it("hides paused business categories", () => {
    expect(isLaunchBusinessCategoryEnabled("educacao")).toBe(false);
    expect(isLaunchBusinessCategoryEnabled("restaurante")).toBe(true);
  });

  it("keeps active feed channels and filters paused post formats", () => {
    expect(isLaunchCommunityFeedChannelEnabled("geral")).toBe(true);
    expect(isLaunchCommunityFeedChannelEnabled("eventos")).toBe(true);
    expect(isLaunchCommunityFeedChannelEnabled("vagas")).toBe(true);

    expect(isLaunchCommunityPostEnabled({ content_intent: "duvida" })).toBe(
      true,
    );
    expect(
      isLaunchCommunityPostEnabled({ content_intent: "alerta_urgente" }),
    ).toBe(false);
    expect(isLaunchCommunityPostEnabled({ display_format: "event_card" })).toBe(
      true,
    );
    expect(isLaunchCommunityPostEnabled({ type: "oportunidade" })).toBe(true);
    expect(
      isLaunchCommunityPostEnabled({
        distribution_channels: ["geral", "eventos"],
      }),
    ).toBe(true);
  });
});
