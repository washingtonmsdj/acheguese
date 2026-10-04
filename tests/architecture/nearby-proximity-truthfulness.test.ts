import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("nearby MVP boundary", () => {
  const page = read("src/core/nearby/pages/NearbyPage.tsx");
  const pageCss = read("src/core/nearby/pages/NearbyPage.css");
  const routeWrapper = read("src/app/pages/NearbyPage.tsx");
  const providerScope = read("src/app/config/nearbyProviderScope.ts");
  const activeTerritorialWrapper = read(
    "src/app/routes/territorial/ActiveTerritorialModulePages.tsx",
  );
  const surfaceAvailabilityHook = read(
    "src/core/territorial/hooks/useGroupSurfaceAvailability.ts",
  );
  const surfaceAvailability = read(
    "src/core/territorial/groupSurfaceAvailability.ts",
  );
  const providerRegistry = read("src/core/nearby/providers/registry.ts");
  const platformRegistry = read("src/app/config/platformCapabilityRegistry.ts");
  const hook = read("src/core/nearby/hooks/useNearbyBusinesses.ts");
  const card = read("src/core/nearby/components/NearbyCard.tsx");
  const map = read("src/core/nearby/components/NearbyMiniMap.tsx");
  const filters = read("src/core/nearby/components/NearbyFilters.tsx");
  const section = read("src/core/nearby/components/NearbySection.tsx");
  const territorialLayout = read("src/core/routing/components/TerritorialLayout.tsx");
  const nearbyConfig = read("src/core/nearby/config/nearbyConfig.ts");

  it("uses location quality rather than fallback coordinates as personal proximity truth", () => {
    expect(page).toContain("useTerritorialContextOptional");
    expect(page).toContain("territoryLocation: routeFallbackLocation");
    expect(page).toContain('type: "address"');
    expect(page).toContain('type: "gps"');
    expect(page).toContain("setSavedReference(reference)");
    expect(page).toContain("const isGoodForProximity = Boolean(savedReference)");
    expect(page).toContain("const spatialLocationId = territorialContext");
    expect(page).toContain("center: spatialCenter");
    expect(page).toContain("locationIds: spatialLocationIds");
    expect(page).toContain(
      'enabled: providerIds.includes("business") && isGoodForProximity',
    );
    expect(page).toContain("Informe um endereço ou ative o GPS para calcular distâncias reais.");
  });

  it("keeps Nearby horizontal and gates the current Business provider separately", () => {
    expect(platformRegistry).toContain('dependsOnCapabilities: ["map", "location"]');
    expect(platformRegistry).not.toContain('dependsOnProductModules: ["business"]');
    expect(providerRegistry).toContain('export type NearbyProviderId = "business"');
    expect(providerScope).toContain('isPlatformCapabilityEnabled("nearby")');
    expect(providerScope).toContain("isProductModuleEnabled(productModule)");
    expect(routeWrapper).toContain("getActiveNearbyProviderIds()");
    expect(page).toContain('providerIds.includes("business")');
    expect(page).toContain("providerIds.length === 0");
    expect(hook).toContain("providerEnabled && center !== null");
    expect(hook).toContain('import("@/core/business/services/BusinessService")');
    expect(hook).not.toContain('import { BusinessService } from');
    expect(hook).toContain('entityType: "business"');
    expect(hook).toContain("BusinessService.getBusinessesByIds(ids)");
    expect(hook).toContain("BusinessUrlService.getPublicCanonicalUrl");
    expect(hook).toContain("useSpatialSearchHybrid");
    expect(hook).toContain("item.in_territory === true");
    expect(territorialLayout).not.toContain("[MODULE_SLUGS.map]: ModuleKey.BUSINESS");
    expect(territorialLayout).not.toContain("[MODULE_SLUGS.nearby]: ModuleKey.BUSINESS");
    expect(providerScope).toContain("PROVIDER_ROLLOUT_MODULE");
    expect(providerScope).toContain("getActiveNearbyProviderRolloutModuleKeys");
    expect(activeTerritorialWrapper).toContain("[MODULE_SLUGS.map]");
    expect(activeTerritorialWrapper).toContain("[MODULE_SLUGS.nearby]");
    expect(activeTerritorialWrapper).toContain(
      "getActiveMapLayerRolloutModuleKeys()",
    );
    expect(activeTerritorialWrapper).toContain(
      "getActiveNearbyProviderRolloutModuleKeys()",
    );
    expect(territorialLayout).toContain("moduleKeysBySlug");
    expect(territorialLayout).toContain("useGroupSurfaceAvailability");
    expect(surfaceAvailabilityHook).toContain('queryKey: ["group-availability"');
    expect(surfaceAvailability).toContain(
      "new Set(results.flatMap((result) => result.active_member_ids))",
    );
    expect(hook).not.toContain('entityType: "event"');
    expect(hook).not.toContain('entityType: "alert"');
    expect(hook).not.toContain('entityType: "tourist_point"');

    expect(page).not.toContain("gastronomy");
    expect(page).not.toContain("classified");
    expect(page).not.toContain("tourist");
    expect(page).not.toContain("services");
  });

  it("navigates exclusively through canonical Business URLs", () => {
    expect(card).toContain("business.canonicalUrl");
    expect(card).not.toContain("APP_MODULE_SLUGS");
    expect(card).not.toContain("useFriendlyModuleUrls");
    expect(map).toContain("url: business.canonicalUrl");
    expect(map).toContain("navigate(business.canonicalUrl)");
    expect(map).toContain("onMarkerClick={handleMarkerClick}");
    expect(map).toContain("projectBusiness");
  });

  it("never renders personal distance or a user marker from a territorial center", () => {
    expect(card).toContain("const hasRealDistance =");
    expect(card).toContain("isPreciseNearbyDistance");
    expect(card).not.toContain("100000");
    expect(nearbyConfig).toContain("showProximity && Number.isFinite(meters) && meters > 0");
    expect(card).toContain("em linha reta");
    expect(card).not.toContain("getWalkingTime");
    expect(card).not.toContain("<Clock");
    expect(filters).toContain(
      'showProximity ? "Raio:" : "Recorte a partir do centro:"',
    );
    expect(map).toContain("enabled: showProximity");
    expect(map).toContain("autoAdd: showProximity");
  });

  it("keeps zero-result states explicit instead of hiding Nearby content", () => {
    expect(section).toContain('emptyMessage = "Nenhum resultado encontrado neste recorte."');
    expect(section).toContain("{emptyMessage}");
    expect(section).not.toContain("if (isEmpty && !isLoading) return null");
    expect(page).toContain("Nenhum resultado neste recorte");
    expect(page).toContain("Amplie o raio ou remova os filtros para ver mais opções.");
    expect(page).toContain('className="nb-no-results"');
  });

  it("keeps the map CTA accessible independently of responsive copy", () => {
    expect(page).toContain('aria-label="Abrir mapa completo"');
    expect(page).toContain('title="Abrir mapa completo"');
    expect(page).toContain('<ArrowRight aria-hidden="true" />');
  });

  it("uses the canonical Business taxonomy instead of local category aliases", () => {
    expect(page).toContain("BUSINESS_CATEGORY_OPTIONS");
    expect(page).toContain("getBusinessCategoryLabel");
    expect(page).not.toContain('value: "alimentacao"');
    expect(page).not.toContain('value: "mercados"');
    expect(page).not.toContain('value: "beleza"');
    expect(filters).not.toContain("QUICK_CATEGORIES");
  });

  it("keeps the active Nearby presentation on the territorial visual SSOT", () => {
    expect(pageCss).toContain("font-family:var(--font-sans)");
    expect(pageCss).toContain("hsl(var(--territory-surface))");
    expect(pageCss).toContain("hsl(var(--territory-ink))");
    expect(pageCss).toContain("hsl(var(--territory-muted))");
    expect(pageCss).toContain("hsl(var(--territory-brand))");
    expect(pageCss).toContain("hsl(var(--territory-border))");
    expect(pageCss).toContain("hsl(var(--territory-sun))");
    expect(pageCss).not.toMatch(/--nb-[a-z0-9-]+\s*:/i);
    expect(pageCss).not.toMatch(/(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/);
    expect(pageCss).not.toContain("font-family:Inter");

    const weights = Array.from(
      pageCss.matchAll(/font-weight\s*:\s*(\d{3})\b/g),
      (match) => match[1],
    );
    expect(weights.length).toBeGreaterThan(0);
    for (const weight of weights) {
      expect(["400", "500", "600", "700", "800"]).toContain(weight);
    }

    expect(map).toContain("h-[13.75rem]");
    expect(map).toContain("min-[521px]:h-[300px]");
    expect(map).toContain("min-[1181px]:h-[310px]");
    expect(map).toContain("border-territory-border/50");
    expect(map).toContain("bg-territory-raised/30");
    expect(map).toContain("text-territory-muted");
    expect(map).not.toContain('style={{ height: "400px" }}');
    expect(map).not.toContain("border-border/50");
    expect(map).not.toContain("bg-muted/30");
    expect(map).not.toContain("text-muted-foreground");
  });
});
