import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("premium business public site", () => {
  it("exposes isolated /p routes and does not use legacy redirect route", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");

    expect(routesSource).toContain('path="/p/:slug/*"');
    expect(routesSource).toContain('path="cardapio"');
    expect(routesSource).toContain('path="produto/:productSlug"');
    expect(routesSource).toContain('path="carrinho"');
    expect(routesSource).toContain('path="checkout"');
    expect(routesSource).not.toContain("BusinessPremiumRoute");
  });

  it("resolves /p via PremiumBusinessSiteResolver and snapshots only", () => {
    const source = readProjectFile(
      "src/modules/business/premium/pages/PremiumBusinessSiteRoute.tsx",
    );

    expect(source).toContain("PremiumBusinessSiteResolver.resolve");
    expect(source).toContain("usePublicBusinessSnapshot");
    expect(source).toContain("usePublicGastronomySnapshot");
    expect(source).toContain("PremiumBusinessShell");
    expect(source).not.toContain("profileService.getByHandle");
  });

  it("keeps institutional page without transactional controls", () => {
    const source = readProjectFile(
      "src/modules/business/premium/pages/PremiumBusinessHomePage.tsx",
    );

    expect(source).toContain("Ver cardapio e pedir");
    expect(source).toContain("Link to={routes.menu}");
    expect(source).not.toContain("MenuItemDetailDrawer");
    expect(source).not.toContain("StickyOrderBar");
    expect(source).not.toContain("GastronomyCheckoutSheet");
    expect(source).not.toContain("EmpresaProximasSection");
  });

  it("uses official gastronomy transaction engine in premium menu and checkout routes", () => {
    const menuSource = readProjectFile(
      "src/modules/business/premium/pages/PremiumBusinessMenuPage.tsx",
    );
    const checkoutSource = readProjectFile(
      "src/modules/business/premium/pages/PremiumBusinessCheckoutPage.tsx",
    );

    expect(menuSource).toContain("MenuItemDetailDrawer");
    expect(menuSource).toContain("StickyOrderBar");
    expect(menuSource).toContain("useGastronomyCart");
    expect(menuSource).toContain("Link to={routes.product");

    expect(checkoutSource).toContain("GastronomyCheckoutSheet");
    expect(checkoutSource).not.toContain("createOrder(");
  });
});

