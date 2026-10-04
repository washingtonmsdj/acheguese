import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const FAVORITES_PAGE = path.join(
  ROOT,
  "src/modules/business/gastronomy/pages/MyFavoritesPage.tsx",
);

const LEGACY_VISUAL_TOKENS = [
  "bg-background",
  "bg-card",
  "text-foreground",
  "text-muted-foreground",
  "text-primary",
  "bg-primary",
] as const;

describe("gastronomy favorites visual SSOT", () => {
  it("keeps the paused Gastronomy favorites owner versioned and territorial", () => {
    expect(fs.existsSync(FAVORITES_PAGE)).toBe(true);

    const source = fs.readFileSync(FAVORITES_PAGE, "utf8");
    expect(source).toContain("bg-territory-canvas");
    expect(source).toContain("bg-territory-surface");
    expect(source).toContain("text-territory-ink");
    expect(source).toContain("text-territory-muted");
    expect(source).toContain("bg-territory-brand");
    expect(source).toContain("bg-territory-sun");

    for (const token of LEGACY_VISUAL_TOKENS) {
      expect(source, `legacy visual token returned: ${token}`).not.toContain(token);
    }
  });

  it("keeps the favorites owner disconnected while Gastronomy is paused", () => {
    const registry = fs.readFileSync(
      path.join(ROOT, "src/app/config/productModuleRegistry.ts"),
      "utf8",
    );
    const routes = fs.readFileSync(
      path.join(ROOT, "src/app/routes/sections/AppLayoutRoutes.tsx"),
      "utf8",
    );
    const lazyImports = fs.readFileSync(
      path.join(ROOT, "src/app/routes/activeLazyImports.ts"),
      "utf8",
    );

    expect(registry).toContain('gastronomy: {');
    expect(registry).toContain('status: "paused"');
    expect(routes).not.toContain("MyFavoritesPage");
    expect(lazyImports).not.toContain("MyFavoritesPage");
  });
});
