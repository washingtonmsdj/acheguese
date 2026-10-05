import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const searchScope = readFileSync(
  "src/app/config/searchProviderScope.ts",
  "utf8",
);
const nearbyScope = readFileSync(
  "src/app/config/nearbyProviderScope.ts",
  "utf8",
);
const mapScope = readFileSync(
  "src/app/config/mapLayerProviderScope.ts",
  "utf8",
);

describe("active provider scope dispatch", () => {
  it("keeps search provider ownership explicit", () => {
    expect(searchScope).toContain("function getProviderProductModule(bucket: SearchBucket)");
    expect(searchScope).toContain('case "businesses":');
    expect(searchScope).toContain('case "posts":');
    expect(searchScope).not.toContain("PROVIDER_PRODUCT_MODULE[bucket]");
  });

  it("keeps nearby provider ownership explicit", () => {
    expect(nearbyScope).toContain("function getProviderProductModule(providerId: NearbyProviderId)");
    expect(nearbyScope).toContain("function getProviderRolloutModule(providerId: NearbyProviderId)");
    expect(nearbyScope).not.toContain("PROVIDER_PRODUCT_MODULE[providerId]");
    expect(nearbyScope).not.toContain("PROVIDER_ROLLOUT_MODULE[providerId]");
  });

  it("keeps map layer provider ownership explicit", () => {
    expect(mapScope).toContain("function getProviderProductModule(providerId: MapLayerProviderId)");
    expect(mapScope).toContain("function getProviderRolloutModule(providerId: MapLayerProviderId)");
    expect(mapScope).not.toContain("PROVIDER_PRODUCT_MODULE[providerId]");
    expect(mapScope).not.toContain("PROVIDER_ROLLOUT_MODULE[providerId]");
  });
});
