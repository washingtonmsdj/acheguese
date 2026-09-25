import { describe, expect, it } from "vitest";

import { ACTIVE_MODULES, getContextMessageFromPath } from "../modules";
import {
  PRODUCT_MODULE_REGISTRY,
} from "../productModuleRegistry";
import {
  PLATFORM_CAPABILITY_REGISTRY,
} from "../platformCapabilityRegistry";
import {
  getActivePlatformCapabilities,
  getActiveProductModules,
} from "../lifecycleRegistry";
import {
  isLaunchClassifiedCategoryEnabled,
  isLaunchCommunityFeedChannelEnabled,
  isLaunchCommunityPostEnabled,
  isLaunchSurfaceEnabled,
} from "../launchScope";

describe("launchScope", () => {
  it("keeps Business active as domain and the MVP platform capabilities active", () => {
    expect(getActiveProductModules()).toEqual(["business"]);
    expect(getActivePlatformCapabilities()).toEqual(
      expect.arrayContaining(["profiles", "map", "nearby", "search", "messaging"]),
    );
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby).toEqual({
      status: "active",
      dependsOnCapabilities: ["map", "location"],
    });

    expect(PRODUCT_MODULE_REGISTRY.business.status).toBe("active");

    for (const enabled of [
      "home",
      "profiles",
      "business",
      "map",
      "nearby",
      "search",
      "messaging",
    ] as const) {
      expect(isLaunchSurfaceEnabled(enabled)).toBe(true);
    }

    for (const paused of [
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

  it("keeps presentation metadata aligned without duplicating lifecycle ownership", () => {
    const activeIds = ACTIVE_MODULES.map((module) => module.id);

    for (const activeId of ["business", "map", "nearby", "search"]) {
      expect(activeIds).toContain(activeId);
    }

    for (const pausedId of [
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
    expect(getContextMessageFromPath("/busca/ba/salvador")).toBe("Buscar em");

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
