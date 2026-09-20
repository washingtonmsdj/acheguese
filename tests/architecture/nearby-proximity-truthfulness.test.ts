import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("nearby proximity truthfulness", () => {
  const page = read("src/app/pages/NearbyPage.tsx");
  const card = read("src/core/nearby/components/NearbyCard.tsx");
  const map = read("src/core/nearby/components/NearbyMiniMap.tsx");
  const filters = read("src/core/nearby/components/NearbyFilters.tsx");
  const classifieds = read(
    "src/core/nearby/components/NearbyClassifiedsSection.tsx",
  );

  it("uses location quality, not fallback coordinates, as the personal proximity gate", () => {
    expect(page).toContain("const hasPreciseProximity = isGoodForProximity");
    expect(page).toContain("showProximity={hasPreciseProximity}");
    expect(page).toContain(
      "O recorte usa o centro do território como referência; ative o GPS para ver distâncias pessoais.",
    );
    expect(page).not.toContain("const distanceContext = isGps");
  });

  it("never renders personal distance or walking time from a territorial center", () => {
    expect(card).toContain(
      "showProximity && entity.distance > 0 && entity.distance < 100000",
    );
    expect(card).toContain("showProximity: boolean");
    expect(filters).toContain(
      'showProximity ? "Raio:" : "Recorte a partir do centro:"',
    );
  });

  it("removes proximity metadata and the user marker when the center is only territorial", () => {
    expect(map).toContain("delete metadataWithoutProximity.distance");
    expect(map).toContain("delete metadataWithoutProximity.distance_meters");
    expect(map).toContain("enabled: showProximity");
    expect(map).toContain("autoAdd: showProximity");
    expect(map).toContain("distance_meters: entity.distance");
  });

  it("removes the classified map control until classifieds are actually represented on the map", () => {
    expect(page).not.toContain("handleShowClassifiedInMap");
    expect(page).not.toContain("highlightedItemId");
    expect(classifieds).not.toContain("onShowInMap");
    expect(classifieds).not.toContain("Ver no mapa");
  });
});
