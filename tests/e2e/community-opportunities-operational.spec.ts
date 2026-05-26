import { expect, test, type Page } from "@playwright/test";

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

test.describe("community opportunities public surface", () => {
  test.setTimeout(180_000);

  test("opportunities route renders without falling back to global loader", async ({ page }) => {
    await page.goto(
      "/comunidade/ba/salvador/area/complexo-do-nordeste-de-amaralina/oportunidades",
      { waitUntil: "domcontentloaded", timeout: 120_000 },
    );

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Oportunidades|Vagas|Comunidade|Complexo/i);

    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa"), { timeout: 30_000 })
      .toBe(false);
  });
});
