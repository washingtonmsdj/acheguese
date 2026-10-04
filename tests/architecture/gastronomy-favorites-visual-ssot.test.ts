import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PRODUCT_MODULE_REGISTRY } from "../../src/app/config/productModuleRegistry";

const ROOT = process.cwd();
const GASTRONOMY_UI_OWNERS = [
  "src/modules/business/gastronomy/pages/MyFavoritesPage.tsx",
  "src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx",
  "src/modules/business/gastronomy/pages/GastronomyDetailMenuSection.tsx",
  "src/modules/business/gastronomy/pages/GastronomyDetailNavigation.tsx",
] as const;

const GASTRONOMY_PAGE_SHELLS = GASTRONOMY_UI_OWNERS.slice(0, 2);

const LEGACY_VISUAL_TOKENS = [
  "bg-background",
  "bg-card",
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "bg-primary",
] as const;

describe("gastronomy visual SSOT", () => {
  it("keeps migrated paused Gastronomy UI owners versioned and territorial", () => {
    for (const relativePath of GASTRONOMY_UI_OWNERS) {
      const absolutePath = path.join(ROOT, relativePath);
      expect(fs.existsSync(absolutePath), relativePath).toBe(true);

      const source = fs.readFileSync(absolutePath, "utf8");
      expect(source, relativePath).toContain("bg-territory-surface");
      expect(source, relativePath).toContain("text-territory-ink");
      expect(source, relativePath).toContain("text-territory-muted");

      for (const token of LEGACY_VISUAL_TOKENS) {
        expect(source, `${relativePath}: legacy visual token returned: ${token}`).not.toContain(token);
      }
    }

    for (const relativePath of GASTRONOMY_PAGE_SHELLS) {
      expect(fs.readFileSync(path.join(ROOT, relativePath), "utf8"), relativePath).toContain(
        "bg-territory-canvas",
      );
    }

    const favorites = fs.readFileSync(
      path.join(ROOT, GASTRONOMY_UI_OWNERS[0]),
      "utf8",
    );
    expect(favorites).toContain("bg-territory-brand");
    expect(favorites).toContain("bg-territory-sun");
  });

  it("keeps migrated Gastronomy page owners disconnected while the product is paused", () => {
    expect(PRODUCT_MODULE_REGISTRY.gastronomy.status).toBe("paused");

    const routes = fs.readFileSync(
      path.join(ROOT, "src/app/routes/sections/AppLayoutRoutes.tsx"),
      "utf8",
    );
    const lazyImports = fs.readFileSync(
      path.join(ROOT, "src/app/routes/activeLazyImports.ts"),
      "utf8",
    );

    for (const ownerName of ["MyFavoritesPage", "GastronomyDetailPage"]) {
      expect(routes).not.toContain(ownerName);
      expect(lazyImports).not.toContain(ownerName);
    }
  });
});
