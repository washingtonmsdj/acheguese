import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("nearby MVP boundary", () => {
  const page = read("src/core/nearby/pages/NearbyPage.tsx");
  const hook = read("src/core/nearby/hooks/useNearbyBusinesses.ts");
  const card = read("src/core/nearby/components/NearbyCard.tsx");
  const map = read("src/core/nearby/components/NearbyMiniMap.tsx");
  const filters = read("src/core/nearby/components/NearbyFilters.tsx");
  const section = read("src/core/nearby/components/NearbySection.tsx");

  it("uses location quality rather than fallback coordinates as personal proximity truth", () => {
    expect(page).toContain("const hasPreciseProximity = isGoodForProximity");
    expect(page).toContain("useTerritorialContextOptional");
    expect(page).toContain("territoryLocation: routeFallbackLocation");
    expect(page).toContain("const spatialLocationId = territorialContext");
    expect(page).toContain("const routeCenterUnavailable =");
    expect(page).toContain("center: spatialCenter");
    expect(page).toContain("showProximity={hasPreciseProximity}");
    expect(page).toContain(
      "O recorte usa o centro do território como referência; ative o GPS para ver distâncias pessoais.",
    );
    expect(page).toContain("Não foi possível determinar o centro deste território; ative o GPS.");
  });

  it("integrates only with the Business public owner", () => {
    expect(hook).toContain('entityType: "business"');
    expect(hook).toContain("BusinessService.getBusinessesByIds(ids)");
    expect(hook).toContain("BusinessUrlService.getPublicCanonicalUrl");
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
    expect(map).toContain("projectBusiness");
  });

  it("never renders personal distance or a user marker from a territorial center", () => {
    expect(card).toContain("const hasRealDistance =");
    expect(card).toContain("showProximity &&");
    expect(card).toContain("business.distanceMeters > 0");
    expect(card).toContain("business.distanceMeters < 100000");
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
    expect(page).toContain("Nenhuma empresa encontrada em até ${radiusKm}km.");
    expect(page).toContain("Nenhuma empresa encontrada ${territoryLabels.inTerritory}.");
  });

  it("does not retain fake cross-module category filters", () => {
    expect(filters).not.toContain("QUICK_CATEGORIES");
    expect(filters).not.toContain("Turismo");
    expect(filters).not.toContain("Servicos");
    expect(filters).not.toContain("Alimentacao");
  });
});
