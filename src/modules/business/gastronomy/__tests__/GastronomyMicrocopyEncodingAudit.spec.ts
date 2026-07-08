import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");
const mojibakePattern = new RegExp("[\\u00c3\\ud83d\\ufffd]|\\u00e2\\u20ac");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy production microcopy audit", () => {
  it("keeps critical public and order surfaces free from mojibake markers", () => {
    const criticalSources = [
      readProjectFile(
        "src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx",
      ),
      readProjectFile("src/modules/business/gastronomy/pages/OrdersPage.tsx"),
      readProjectFile(
        "src/modules/business/gastronomy/pages/OrderDetailsPage.tsx",
      ),
      readProjectFile(
        "src/modules/business/gastronomy/pages/GastronomyCheckoutPage.tsx",
      ),
      readProjectFile(
        "src/modules/business/gastronomy/components/GastronomyCheckoutSheet.tsx",
      ),
      readProjectFile(
        "src/modules/business/gastronomy/checkout/CheckoutSections.tsx",
      ),
      readProjectFile(
        "src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx",
      ),
    ];

    for (const source of criticalSources) {
      expect(source).not.toMatch(mojibakePattern);
    }
  });

  it("keeps normalized Portuguese copy on checkout and landing entry points", () => {
    const premiumDetailSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx",
    );
    const checkoutPageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyCheckoutPage.tsx",
    );
    const checkoutSheetSource = readProjectFile(
      "src/modules/business/gastronomy/components/GastronomyCheckoutSheet.tsx",
    );
    const checkoutSectionsSource = readProjectFile(
      "src/modules/business/gastronomy/checkout/CheckoutSections.tsx",
    );
    const landingSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx",
    );

    expect(premiumDetailSource).toContain("Explorar cardápio");
    expect(checkoutPageSource).toContain("CheckoutOrderNotesField");
    expect(checkoutSheetSource).toContain("CheckoutOrderNotesField");
    expect(checkoutSectionsSource).toContain("Observações do pedido");
    expect(landingSource).toContain(
      "Restaurantes, cardápios e sabores perto de você",
    );
    expect(landingSource).toContain("itens de cardápio no território");
  });
});
