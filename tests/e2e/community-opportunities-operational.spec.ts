import { expect, test, type Page } from "@playwright/test";

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

test.describe("community opportunities public surface", () => {
  test.setTimeout(180_000);

  test("paused opportunities tab falls back to the community surface", async ({ page }) => {
    await page.goto(
      "/comunidade/ba/salvador/feed?tab=oportunidades",
      { waitUntil: "domcontentloaded", timeout: 120_000 },
    );

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Feed|Comunidade|Complexo|Salvador/i);

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .not.toMatch(/Publicar vaga|Vagas proximas|Vagas próximas/i);

    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa"), { timeout: 30_000 })
      .toBe(false);
  });
});
