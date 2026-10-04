import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const productsSection = readFileSync(
  "src/modules/business/company/sections/EmpresaProdutosSection.tsx",
  "utf8",
);
const productCard = readFileSync(
  "src/modules/business/company/components/cards/ProductCard.tsx",
  "utf8",
);
const nearbyBusinessCard = readFileSync(
  "src/modules/business/company/components/cards/NearbyBusinessCard.tsx",
  "utf8",
);
const photosSection = readFileSync(
  "src/modules/business/company/sections/EmpresaFotosSection.tsx",
  "utf8",
);

const visualOwners = [
  productsSection,
  productCard,
  nearbyBusinessCard,
  photosSection,
] as const;
const directPalette =
  /\b(?:text|bg|border|ring|ring-offset|fill)-(?:teal|cyan|emerald|slate|white|black|amber|rose|sky|gray)(?:[-/\[]|\b)/;

describe("Business detail content visual SSOT", () => {
  it("keeps product, related-business and photo surfaces on semantic territorial tokens", () => {
    expect(productsSection).toContain("territory-action-on-image");
    expect(productsSection).toContain("territory-image-overlay");
    expect(productsSection).toContain("territory-on-image");
    expect(productsSection).toContain("Produtos e serviços");
    expect(productsSection).toContain("Ver cardápio completo");

    expect(productCard).toContain("territory-action-on-image");
    expect(productCard).toContain("territory-image-overlay");
    expect(productCard).toContain("territory-success");
    expect(productCard).toContain("territory-sun");

    expect(nearbyBusinessCard).toContain("territory-action-on-image");
    expect(nearbyBusinessCard).toContain("territory-image-overlay");
    expect(nearbyBusinessCard).toContain("territory-sun");
    expect(nearbyBusinessCard).toContain("shadow-territory-highlight");

    expect(photosSection).toContain("territory-action-on-image");
    expect(photosSection).toContain("territory-on-image");
    expect(photosSection).toContain("territory-image-overlay");
    expect(photosSection).not.toMatch(/\btext-(?:primary|foreground|muted-foreground)\b/);

    for (const owner of visualOwners) {
      expect(owner).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(owner).not.toMatch(/\brgba?\s*\(/);
      expect(owner).not.toMatch(directPalette);
    }
  });
});
