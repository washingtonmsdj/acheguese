import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("MVP Business discovery launch boundary", () => {
  const launchScope = read("src/app/config/launchScope.ts");
  const businessQueries = read("src/core/business/services/business.queries.ts");
  const searchProviders = read("src/core/search/providers/searchProviders.ts");
  const landing = read("src/core/landing/services/LandingFeaturedService.ts");
  const map = read("src/core/maps/services/MapBusinessLayerRuntimeService.ts");
  const spatial = read("src/core/geospatial/services/SpatialSearchService.ts");
  const nearby = read("src/core/nearby/hooks/useNearbyBusinesses.ts");
  const aiSearch = read("src/core/ai/actions/SearchBusinessesActionHandler.ts");

  it("does not couple Business categories to paused specialized verticals", () => {
    expect(launchScope).toContain("const BUSINESS_CATEGORY_SURFACES");
    expect(launchScope).toContain("= {};");
    expect(launchScope).toContain("getLaunchPausedBusinessCategoryIds");
  });

  it("filters the canonical public Business list before pagination", () => {
    const launchFilter = businessQueries.indexOf("getLaunchPausedBusinessCategoryIds");
    const range = businessQueries.indexOf("query = query.range(", launchFilter);

    expect(launchFilter).toBeGreaterThanOrEqual(0);
    expect(businessQueries).toContain("pausedBusinessCategories.length > 0");
    expect(range).toBeGreaterThan(launchFilter);
    expect(searchProviders).toContain("BusinessService.getBusinessesList");
  });

  it("filters Home and Map before bounded limits", () => {
    expect(landing).toContain("applyLaunchBusinessCategoryExclusion");
    expect(landing).toContain('isLaunchSurfaceEnabled("education")');
    expect(landing).toContain("schoolCountPromise");
    expect(landing.indexOf("applyLaunchBusinessCategoryExclusion(query)"))
      .toBeLessThan(landing.indexOf("query = query.limit(limit)"));

    expect(map).toContain("getLaunchPausedBusinessCategoryIds");
    expect(map).toContain("pausedBusinessCategories.length > 0");
    expect(map.indexOf("getLaunchPausedBusinessCategoryIds"))
      .toBeLessThan(map.indexOf("query = query.limit(limit)"));
  });

  it("keeps spatial Business discovery launch-safe through the Business owner", () => {
    expect(spatial).toContain("BUSINESS_SPATIAL_CANDIDATE_MULTIPLIER");
    expect(spatial).toContain("BusinessService.getLaunchVisibleBusinessProfileIds");
    expect(spatial).not.toContain(".from('public_business_search')");
    expect(businessQueries).toContain("getLaunchVisibleBusinessProfileIds");
    expect(businessQueries).toContain("launch-visible profile lookup failed");
    expect(nearby).toContain('entityType: "business"');
    expect(nearby).toContain("BusinessService.getBusinessesByIds(ids)");
    expect(nearby).toContain("BusinessUrlService.getPublicCanonicalUrl");
    expect(aiSearch).toContain('entityType: "business"');
  });
});
