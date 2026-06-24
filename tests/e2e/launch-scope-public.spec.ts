import { expect, test, type Page } from "@playwright/test";

async function openRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
}

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

async function expectPausedRoute(page: Page, path: string) {
  await openRoute(page, path);

  await expect
    .poll(() => readBodyText(page), { timeout: 60_000 })
    .toMatch(/MVP publico|MVP público/i);
  await expect
    .poll(() => readBodyText(page), { timeout: 60_000 })
    .toMatch(/separado para ajustes/i);
}

test.describe("public launch scope", () => {
  test.setTimeout(180_000);

  test("global paused routes render the launch isolation page", async ({ page }) => {
    for (const path of [
      "/eventos",
      "/vagas",
      "/educacao",
      "/comunicacao",
      "/cupons",
      "/analytics",
      "/mobilidade",
      "/ranking",
      "/alertas",
      "/problemas",
      "/achados-perdidos",
      "/mensagens",
      "/create-driver",
    ]) {
      await expectPausedRoute(page, path);
    }
  });

  test("territorial paused routes render before resolving territory data", async ({ page }) => {
    for (const path of [
      "/eventos/ba/salvador",
      "/eventos/ba/salvador/calendario",
      "/vagas/ba/salvador",
      "/educacao/ba/salvador",
      "/comunicacao/ba/salvador",
      "/comunidade/ba/salvador/eventos",
      "/comunidade/ba/salvador/vagas",
      "/comunidade/ba/salvador/educacao",
      "/comunidade/ba/salvador/mobilidade",
      "/comunidade/ba/salvador/problemas",
      "/comunidade/ba/salvador/achados-e-perdidos",
      "/comunidade/ba/salvador/comunicacao",
    ]) {
      await expectPausedRoute(page, path);
    }
  });
});
