import { describe, expect, it } from "vitest";

import { ACTIVE_MODULES, getContextMessageFromPath } from "../modules";
import {
  PRODUCT_MODULE_REGISTRY,
  getActiveProductModules,
} from "../productModuleRegistry";
import {
  filterLaunchItems,
  filterLaunchSections,
  isLaunchClassifiedCategoryEnabled,
  isLaunchCommunityFeedChannelEnabled,
  isLaunchCommunityPostEnabled,
  isLaunchNavItemEnabled,
  isLaunchSurfaceEnabled,
} from "../launchScope";

describe("launchScope", () => {
  it("keeps only Mapa, Empresas and Perto de mim active as product modules", () => {
    expect(getActiveProductModules().sort()).toEqual(
      ["business", "map", "nearby"].sort(),
    );
    expect(PRODUCT_MODULE_REGISTRY.nearby).toEqual({
      status: "active",
      dependsOn: ["map", "business"],
    });

    for (const enabled of ["home", "business", "map", "nearby"] as const) {
      expect(isLaunchSurfaceEnabled(enabled)).toBe(true);
    }

    for (const paused of [
      "search",
      "community",
      "billing",
      "gastronomy",
      "services",
      "classifieds",
      "touristPoints",
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

  it("filters navigation from the same lifecycle contract", () => {
    expect(isLaunchNavItemEnabled("business")).toBe(true);
    expect(isLaunchNavItemEnabled("map")).toBe(true);
    expect(isLaunchNavItemEnabled("nearby")).toBe(true);
    expect(isLaunchNavItemEnabled("classifieds")).toBe(false);
    expect(isLaunchNavItemEnabled("community")).toBe(false);

    expect(
      filterLaunchItems([
        { id: "business", label: "Empresas" },
        { id: "map", label: "Mapa" },
        { id: "nearby", label: "Perto de Mim" },
        { id: "classifieds", label: "Classificados" },
      ]),
    ).toEqual([
      { id: "business", label: "Empresas" },
      { id: "map", label: "Mapa" },
      { id: "nearby", label: "Perto de Mim" },
    ]);

    expect(
      filterLaunchSections([
        {
          label: "MVP",
          items: [{ id: "business" }, { id: "map" }, { id: "nearby" }],
        },
        {
          label: "Pós-MVP",
          items: [{ id: "community" }, { id: "classifieds" }],
        },
      ]),
    ).toEqual([
      {
        label: "MVP",
        items: [{ id: "business" }, { id: "map" }, { id: "nearby" }],
      },
    ]);
  });

  it("keeps presentation metadata aligned without duplicating lifecycle ownership", () => {
    const activeIds = ACTIVE_MODULES.map((module) => module.id);

    for (const activeId of ["business", "map", "nearby"]) {
      expect(activeIds).toContain(activeId);
    }

    for (const pausedId of [
      "search",
      "community-feed",
      "community-groups",
      "community-recommendations",
      "services",
      "classifieds",
      "community-events",
      "jobs",
      "gastronomy",
      "touristPoints",
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

  it("exposes territory context only for enabled modules", () => {
    expect(getContextMessageFromPath("/empresas/ba/salvador")).toBe(
      "Exibindo empresas de",
    );
    expect(getContextMessageFromPath("/mapa/ba/salvador")).toBe("Mapa de");
    expect(getContextMessageFromPath("/perto-de-mim")).toBe("Perto de");

    expect(getContextMessageFromPath("/servicos/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/classificados/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/comunidade/ba/salvador")).toBeNull();
    expect(getContextMessageFromPath("/gastronomia/ba/salvador")).toBeNull();
  });

  it("fails closed for helpers owned by paused parent modules", () => {
    expect(isLaunchClassifiedCategoryEnabled("vagas")).toBe(false);
    expect(isLaunchClassifiedCategoryEnabled("imoveis")).toBe(false);

    expect(isLaunchCommunityFeedChannelEnabled("geral")).toBe(false);
    expect(isLaunchCommunityFeedChannelEnabled("eventos")).toBe(false);
    expect(isLaunchCommunityPostEnabled({ content_intent: "duvida" })).toBe(false);
    expect(
      isLaunchCommunityPostEnabled({ distribution_channels: ["geral"] }),
    ).toBe(false);
  });

  it("keeps specialized vertical lifecycle independent from Business", () => {
    expect(isLaunchSurfaceEnabled("business")).toBe(true);
    expect(isLaunchSurfaceEnabled("education")).toBe(false);
    expect(isLaunchSurfaceEnabled("gastronomy")).toBe(false);
  });
});
