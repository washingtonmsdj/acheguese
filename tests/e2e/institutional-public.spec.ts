import { expect, test, type Page } from "@playwright/test";

async function openPublicRoute(page: Page, path: string) {
  await page.goto(path, {
    timeout: 15_000,
    waitUntil: "commit",
  });

  await page.waitForTimeout(12_000);
}

async function readBodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

async function hasMainContent(page: Page) {
  return page.evaluate(() => Boolean(document.querySelector("main#main-content"))).catch(() => false);
}

test.describe("institutional public routes", () => {
  test.setTimeout(120_000);

  test.beforeAll(async ({ browser, baseURL }) => {
    const page = await browser.newPage();
    await page
      .goto(`${baseURL ?? ""}/sobre`, {
        timeout: 15_000,
        waitUntil: "commit",
      })
      .catch(() => undefined);
    await page.waitForTimeout(20_000);
    await page.close();
  });

  for (const route of [
    { path: "/sobre", expected: /Sobre o Achegue-se/i },
    { path: "/contato", expected: /Entre em Contato|Achegue-se/i },
    { path: "/termos", expected: /Termos de Uso|Ao utilizar o Achegue-se/i },
    { path: "/privacidade", expected: /Política de Privacidade|como o Achegue-se/i },
  ]) {
    test(`${route.path} exposes canonical brand and accessible main content`, async ({ page }) => {
      await openPublicRoute(page, route.path);

      await expect
        .poll(() => readBodyText(page), { timeout: 60_000 })
        .toMatch(route.expected);
      await expect
        .poll(() => hasMainContent(page), { timeout: 30_000 })
        .toBe(true);
      await expect
        .poll(async () => (await readBodyText(page)).includes("Comunidade Conectada"))
        .toBe(false);
    });
  }
});
