import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Gastronomy checkout consistency audit", () => {
  it("keeps checkout sheet and page aligned on delivery validation and explicit labels", () => {
    const sheetSource = readProjectFile(
      "src/modules/business/gastronomy/components/GastronomyCheckoutSheet.tsx",
    );
    const pageSource = readProjectFile(
      "src/modules/business/gastronomy/pages/GastronomyCheckoutPage.tsx",
    );
    const checkoutRulesSource = readProjectFile(
      "src/modules/business/gastronomy/checkout/checkoutRules.ts",
    );
    const checkoutSectionsSource = readProjectFile(
      "src/modules/business/gastronomy/checkout/CheckoutSections.tsx",
    );

    expect(sheetSource).toContain("buildCheckoutDeliveryAddress");
    expect(sheetSource).toContain("buildCheckoutOrderNotes");
    expect(sheetSource).toContain("isStructuredDeliveryDestinationReady");
    expect(sheetSource).toContain("isCheckoutSubmitDisabled");
    expect(sheetSource).toContain("CheckoutDeliveryAddressFields");
    expect(sheetSource).toContain('idPrefix="sheet"');
    expect(sheetSource).toContain('id="sheet-order-notes"');

    expect(pageSource).toContain("buildCheckoutDeliveryAddress");
    expect(pageSource).toContain("buildCheckoutOrderNotes");
    expect(pageSource).toContain("isStructuredDeliveryDestinationReady");
    expect(pageSource).toContain("isCheckoutSubmitDisabled");
    expect(pageSource).toContain("CheckoutDeliveryAddressFields");
    expect(pageSource).toContain('idPrefix="checkout"');
    expect(pageSource).toContain('id="checkout-order-notes"');

    expect(checkoutRulesSource).toContain(
      "export function buildCheckoutDeliveryAddress",
    );
    expect(checkoutRulesSource).toContain(
      "export function buildCheckoutOrderNotes",
    );
    expect(checkoutRulesSource).toContain(
      "export function isCheckoutSubmitDisabled",
    );

    expect(checkoutSectionsSource).toContain('fieldId("number")');
    expect(checkoutSectionsSource).toContain("<Label htmlFor={id}>");
    expect(checkoutSectionsSource).toContain("aria-pressed={isSelected}");
    expect(checkoutSectionsSource).toContain("Observações do pedido");
  });
});
