import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy SEO and indexation audit", () => {
  it("publishes canonical, robots and JSON-LD on the public gastronomy detail page", () => {
    const pageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx",
    );
    const source = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyDetailSeo.tsx",
    );

    expect(pageSource).toContain("GastronomyDetailSeo");
    expect(source).toContain('name="robots"');
    expect(source).toContain("restaurantSchema");
    expect(source).toContain('"@type": "Restaurant"');
    expect(source).toContain("menuSchema");
    expect(source).toContain("const canonicalHref = canonicalPathOverride");
    expect(source).toContain('communityScoped = false');
    expect(source).toContain('? "noindex, follow"');
    expect(source).toContain("item: canonicalHref");
    expect(source).toContain("application/ld+json");
    expect(source).not.toContain("item: window.location.href");
  });

  it("keeps checkout and order surfaces out of search indexing", () => {
    const checkoutSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyCheckoutPage.tsx",
    );
    const favoritesSource = readProjectFile(
      "src/modules/business/gastronomy/pages/MyFavoritesPage.tsx",
    );
    const ordersSource = readProjectFile(
      "src/modules/business/gastronomy/pages/OrdersPage.tsx",
    );
    const centralLayoutSource = readProjectFile(
      "src/modules/central/components/CentralLayout.tsx",
    );
    const orderDetailsSource = readProjectFile(
      "src/modules/business/gastronomy/pages/OrderDetailsPage.tsx",
    );

    expect(checkoutSource).toContain("noindex, nofollow");
    expect(favoritesSource).toContain("noindex, nofollow");
    expect(centralLayoutSource).toContain("noindex, nofollow");
    expect(ordersSource).toContain("noindex, nofollow");
    expect(orderDetailsSource).toContain("noindex, nofollow");
  });
});
