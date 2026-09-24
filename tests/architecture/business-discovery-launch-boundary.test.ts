import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("MVP Business discovery launch boundary", () => {
  const launchScope = read("src/app/config/launchScope.ts");
  const businessQueries = read("src/core/business/services/business.queries.ts");
  const searchProviders = read("src/core/search/providers/searchProviders.ts");
  const searchProviderScope = read("src/app/config/searchProviderScope.ts");
  const landing = read("src/core/landing/services/LandingFeaturedService.ts");
  const map = read("src/core/maps/services/MapBusinessLayerRuntimeService.ts");
  const businessMap = read("src/core/business/services/BusinessMapQueryService.ts");
  const spatial = read("src/core/geospatial/services/SpatialSearchService.ts");
  const nearby = read("src/core/nearby/hooks/useNearbyBusinesses.ts");
  const aiSearch = read("src/core/ai/actions/SearchBusinessesActionHandler.ts");

  it("does not couple Business categories to paused specialized verticals", () => {
    expect(launchScope).not.toContain("BUSINESS_CATEGORY_SURFACES");
    expect(launchScope).not.toContain("isLaunchBusinessCategoryEnabled");
    expect(launchScope).not.toContain("getLaunchPausedBusinessCategoryIds");
    expect(businessQueries).not.toContain("getLaunchPausedBusinessCategoryIds");
    expect(landing).not.toContain("applyLaunchBusinessCategoryExclusion");
  });

  it("keeps canonical Business discovery independent from vertical lifecycle", () => {
    expect(searchProviders).toContain("BusinessService.getBusinessesList");
    expect(searchProviders).toContain('await import("@/core/business")');
    expect(searchProviderScope).toContain('businesses: "business"');
    expect(businessQueries).toContain('.from("public_business_search")');
    expect(businessQueries).toContain("query = query.range(");
    expect(landing).toContain('isLaunchSurfaceEnabled("education")');
    expect(landing).toContain("schoolCountPromise");

    expect(map).toContain("businessMapQueryService.getBusinessesByBounds");
    expect(map).not.toContain("public_business_search");
    expect(businessMap).toContain('.from<BusinessMapRow>("public_business_search")');
    expect(businessMap).toContain(".limit(limit)");
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
