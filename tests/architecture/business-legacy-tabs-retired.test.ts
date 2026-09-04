import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const retired = [
  "src/modules/business/components/tabs/CardapioTab.tsx",
  "src/modules/business/components/tabs/EstatisticasTab.tsx",
  "src/modules/business/components/tabs/PortfolioTab.tsx",
  "src/modules/business/components/tabs/ProdutosTab.tsx",
  "src/modules/business/components/tabs/PromocoesTab.tsx",
  "src/modules/business/components/tabs/ServicosTab.tsx",
  "src/modules/business/components/tabs/VisaoGeralTab.tsx",
  "src/modules/business/components/DigitalMenu.tsx",
  "src/modules/business/components/BusinessStats.tsx",
  "src/modules/business/components/PhotoGallery.tsx",
  "src/modules/business/components/PromoBanner.tsx",
  "src/modules/business/types/components.ts",
];

describe("G6 Business legacy tab stack", () => {
  it("keeps the orphaned tab stack retired", () => {
    for (const relativePath of retired) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("does not publish retired tab or placeholder components", () => {
    const barrel = readFileSync(
      join(ROOT, "src/modules/business/components/index.ts"),
      "utf8",
    );

    for (const symbol of [
      "CardapioTab",
      "EstatisticasTab",
      "PortfolioTab",
      "ProdutosTab",
      "PromocoesTab",
      "ServicosTab",
      "VisaoGeralTab",
      "DigitalMenu",
      "BusinessStats",
      "PhotoGallery",
      "PromoBanner",
    ]) {
      expect(barrel).not.toContain(symbol);
    }
  });
});
