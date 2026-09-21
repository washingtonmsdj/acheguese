import { describe, expect, it } from "vitest";

import { ACTIVE_MODULES, getContextMessageFromPath } from "../modules";
import {
  filterLaunchItems,
  filterLaunchSections,
  getLaunchPausedBusinessCategoryIds,
  isLaunchBusinessCategoryEnabled,
  isLaunchClassifiedCategoryEnabled,
  isLaunchCommunityFeedChannelEnabled,
  isLaunchCommunityPostEnabled,
  isLaunchNavItemEnabled,
  isLaunchSurfaceEnabled,
} from "../launchScope";

describe("launchScope", () => {
  it("keeps only the narrow MVP product domains public", () => {
    for (const enabled of ["home", "community", "business", "classifieds", "search"] as const) {
      expect(isLaunchSurfaceEnabled(enabled)).toBe(true);
    }

    for (const paused of [
      "billing",
      "gastronomy",
      "services",
      "touristPoints",
      "map",
      "nearby",
      "education",
      "jobs",
      "events",
      "communityEventsPreview",
      "communication",
      "mobility",
      "coupons",
      "gamification",
      "publicAnalytics",
      "communityAlerts",
      "communityIssues",
      "communityLostFound",
      "communityCommunication",
      "familySafety",
    ] as const) {
      expect(isLaunchSurfaceEnabled(paused)).toBe(false);
    }
  });

  it("filters paused navigation items and removes empty sections", () => {
    expect(isLaunchNavItemEnabled("business")).toBe(true);
    expect(isLaunchNavItemEnabled("classifieds")).toBe(true);
    expect(isLaunchNavItemEnabled("map")).toBe(false);
    expect(isLaunchNavItemEnabled("nearby")).toBe(false);
    expect(isLaunchNavItemEnabled("jobs")).toBe(false);

    expect(
      filterLaunchItems([
        { id: "business", label: "Empresas" },
        { id: "map", label: "Mapa" },
        { id: "classifieds", label: "Classificados" },
        { id: "jobs", label: "Vagas" },
      ]),
    ).toEqual([
      { id: "business", label: "Empresas" },
      { id: "classifieds", label: "Classificados" },
    ]);

    expect(
      filterLaunchSections([
        { label: "Ativas", items: [{ id: "business" }, { id: "classifieds" }] },
        { label: "Pausadas", items: [{ id: "education" }, { id: "map" }] },
      ]),
    ).toEqual([
      { label: "Ativas", items: [{ id: "business" }, { id: "classifieds" }] },
    ]);
  });

  it("keeps the global module registry aligned with the narrow MVP", () => {
    const activeIds = ACTIVE_MODULES.map((module) => module.id);

    expect(activeIds).toContain("community-feed");
    expect(activeIds).toContain("community-groups");
    expect(activeIds).toContain("community-recommendations");
    expect(activeIds).toContain("business");
    expect(activeIds).toContain("classifieds");
    expect(activeIds).toContain("search");

    for (const pausedId of [
      "services",
      "community-events",
      "jobs",
      "gastronomy",
      "touristPoints",
      "map",
      "mobility",
      "education",
      "ranking",
      "community-alerts",
      "community-issues",
      "community-lost-found",
    ]) {
      expect(activeIds).not.toContain(pausedId);
    }
  });

  it("does not expose paused module context in territory chrome", () => {
    expect(getContextMessageFromPath("/mobilidade")).toBeNull();
    expect(getContextMessageFromPath("/educacao/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/gastronomia/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/servicos/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/mapa/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/ranking")).toBeNull();

    expect(getContextMessageFromPath("/empresas/ba/salvador")).toBe(
      "Exibindo empresas de",
    );
  });

  it("keeps Vagas hidden inside Classificados while jobs are post-MVP", () => {
    expect(isLaunchClassifiedCategoryEnabled("vagas")).toBe(false);
    expect(isLaunchClassifiedCategoryEnabled("imoveis")).toBe(true);
  });

  it("keeps Education hidden from Business without hiding normal companies", () => {
    expect(isLaunchBusinessCategoryEnabled("educacao")).toBe(false);
    expect(isLaunchBusinessCategoryEnabled("restaurante")).toBe(true);
    expect(getLaunchPausedBusinessCategoryIds()).toContain("educacao");
    expect(getLaunchPausedBusinessCategoryIds()).not.toContain("restaurante");
  });

  it("keeps Community basic while filtering event/job/alert post formats", () => {
    expect(isLaunchCommunityFeedChannelEnabled("geral")).toBe(true);
    expect(isLaunchCommunityFeedChannelEnabled("eventos")).toBe(false);
    expect(isLaunchCommunityFeedChannelEnabled("vagas")).toBe(false);

    expect(isLaunchCommunityPostEnabled({ content_intent: "duvida" })).toBe(true);
    expect(
      isLaunchCommunityPostEnabled({ content_intent: "alerta_urgente" }),
    ).toBe(false);
    expect(isLaunchCommunityPostEnabled({ display_format: "event_card" })).toBe(
      false,
    );
    expect(isLaunchCommunityPostEnabled({ type: "oportunidade" })).toBe(false);
    expect(
      isLaunchCommunityPostEnabled({
        distribution_channels: ["geral", "eventos"],
      }),
    ).toBe(false);
  });
});
