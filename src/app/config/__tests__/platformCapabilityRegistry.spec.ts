import { describe, expect, it } from "vitest";

import {
  PLATFORM_CAPABILITY_REGISTRY,
  type PlatformCapabilityKey,
} from "../platformCapabilityRegistry";
import {
  getActivePlatformCapabilities,
  isPlatformCapabilityEnabled,
} from "../lifecycleRegistry";

describe("platformCapabilityRegistry", () => {
  it("keeps the MVP horizontal platform capabilities active", () => {
    expect(getActivePlatformCapabilities().sort()).toEqual(
      [
        "auth",
        "account",
        "profiles",
        "territory",
        "location",
        "notifications",
        "central",
        "map",
        "nearby",
        "search",
        "messaging",
      ].sort(),
    );

    expect(isPlatformCapabilityEnabled("messaging")).toBe(true);
    expect(isPlatformCapabilityEnabled("notifications")).toBe(true);
    expect(PLATFORM_CAPABILITY_REGISTRY.notifications).toEqual({
      status: "active",
      dependsOnCapabilities: ["auth"],
    });
  });

  it("keeps Nearby dependent on Map + Location + Business", () => {
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby).toEqual({
      status: "active",
      dependsOnCapabilities: ["map", "location"],
      dependsOnProductModules: ["business"],
    });
    expect(isPlatformCapabilityEnabled("nearby")).toBe(true);
  });

  it("keeps Messaging horizontal while providers are gated separately", () => {
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging).toEqual({
      status: "active",
      dependsOnCapabilities: ["auth", "profiles"],
    });
  });

  it("references only declared capability dependencies and contains no capability cycle", () => {
    const keys = new Set(
      Object.keys(PLATFORM_CAPABILITY_REGISTRY) as PlatformCapabilityKey[],
    );

    const visit = (
      capability: PlatformCapabilityKey,
      path: ReadonlySet<PlatformCapabilityKey>,
    ): void => {
      expect(
        path.has(capability),
        `capability dependency cycle at ${capability}`,
      ).toBe(false);

      const nextPath = new Set(path);
      nextPath.add(capability);

      for (const dependency of
        PLATFORM_CAPABILITY_REGISTRY[capability].dependsOnCapabilities ?? []) {
        expect(
          keys.has(dependency),
          `${capability} -> missing capability ${dependency}`,
        ).toBe(true);
        visit(dependency, nextPath);
      }
    };

    for (const capability of keys) {
      visit(capability, new Set());
    }
  });
});
