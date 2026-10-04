import { describe, expect, it } from "vitest";

import { ACTIVE_MODULES, getContextMessageFromPath } from "../modules";
import { PRODUCT_MODULE_REGISTRY } from "../productModuleRegistry";
import { PLATFORM_CAPABILITY_REGISTRY } from "../platformCapabilityRegistry";
import {
  getActivePlatformCapabilities,
  getActiveProductModules,
} from "../lifecycleRegistry";
import {
  isLaunchCommunityFeedChannelEnabled,
  isLaunchCommunityPostEnabled,
  isLaunchSurfaceEnabled,
} from "../launchScope";

describe("launchScope", () => {
  it("keeps Business active as domain and only certified MVP capabilities active", () => {
    expect(getActiveProductModules()).toEqual(["business"]);
    expect(getActivePlatformCapabilities()).toEqual(
      expect.arrayContaining([
        "auth",
        "profiles",
        "account",
        "territory",
        "location",
        "central",
        "map",
        "nearby",
        "search",
      ]),
    );
    expect(getActivePlatformCapabilities()).not.toEqual(
      expect.arrayContaining(["notifications", "messaging"]),
    );

    expect(PLATFORM_CAPABILITY_REGISTRY.nearby).toEqual({
      status: "active",
      dependsOnCapabilities: ["map", "location"],
    });
    expect(PLATFORM_CAPABILITY_REGISTRY.notifications.status).toBe("paused");
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging.status).toBe("paused");
    expect(PRODUCT_MODULE_REGISTRY.business.status).toBe("active");

    for (const enabled of [
      "home",
      "profiles",
      "business",
      "map",
      "nearby",
      "search",
    ] as const) {
      expect(isLaunchSurfaceEnabled(enabled)).toBe(true);
    }

    for (const paused of [
      "messaging",
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
    expect(getContextMessageFromPath("/ba/salvador/empresas")).toBe(
      "Exibindo empresas de",
    );
    expect(getContextMessageFromPath("/ba/salvador/mapa")).toBe("Mapa de");
    expect(getContextMessageFromPath("/perto-de-mim")).toBe("Perto de");
    expect(getContextMessageFromPath("/ba/salvador/busca")).toBe("Buscar em");

    expect(getContextMessageFromPath("/ba/salvador/servicos")).toBeNull();
    expect(getContextMessageFromPath("/ba/salvador/classificados")).toBeNull();
    expect(getContextMessageFromPath("/ba/salvador/comunidade")).toBeNull();
    expect(getContextMessageFromPath("/ba/salvador/gastronomia")).toBeNull();
  });

  it("fails closed for helpers owned by paused parent modules", () => {
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
