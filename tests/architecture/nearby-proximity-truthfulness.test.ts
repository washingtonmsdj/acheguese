import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("nearby MVP boundary", () => {
  const page = read("src/core/nearby/pages/NearbyPage.tsx");
  const hook = read("src/core/nearby/hooks/useNearbyBusinesses.ts");
  const card = read("src/core/nearby/components/NearbyCard.tsx");
  const map = read("src/core/nearby/components/NearbyMiniMap.tsx");
  const filters = read("src/core/nearby/components/NearbyFilters.tsx");

  it("uses location quality rather than fallback coordinates as personal proximity truth", () => {
    expect(page).toContain("const hasPreciseProximity = isGoodForProximity");
    expect(page).toContain("showProximity={hasPreciseProximity}");
    expect(page).toContain(
      "O recorte usa o centro do território como referência; ative o GPS para ver distâncias pessoais.",
    );
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
    expect(card).toContain(
      "showProximity &&\n    business.distanceMeters > 0",
    );
    expect(filters).toContain(
      'showProximity ? "Raio:" : "Recorte a partir do centro:"',
    );
    expect(map).toContain("enabled: showProximity");
    expect(map).toContain("autoAdd: showProximity");
  });

  it("does not retain fake cross-module category filters", () => {
    expect(filters).not.toContain("QUICK_CATEGORIES");
    expect(filters).not.toContain("Turismo");
    expect(filters).not.toContain("Servicos");
    expect(filters).not.toContain("Alimentacao");
  });
});
