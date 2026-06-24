import { expect, test, type Page } from "@playwright/test";

async function dismissConsentBanner(page: Page) {
  const labels = ["Aceitar Todos", "Aceitar todos", "Fechar"];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;
    await button.click({ timeout: 5_000 }).catch(() => {});
  }
}

async function open(page: Page, path: string) {
  await page.goto(path, {
    timeout: 120_000,
    waitUntil: "domcontentloaded",
  });
  await dismissConsentBanner(page);
}

async function bodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

async function hasMain(page: Page) {
  return page.evaluate(() => Boolean(document.querySelector("main"))).catch(() => false);
}

async function hasGlobalLoader(page: Page) {
  return (await bodyText(page)).includes("Preparando a casa");
}

async function expectRouteResolved(page: Page, expectedPathPart = "/comunidade/") {
  await page.waitForLoadState("domcontentloaded");
  await expect
    .poll(async () => {
      const hasMainLandmark = await hasMain(page);
      const text = await bodyText(page);
      const currentUrl = page.url();
      const hasExpectedPath = currentUrl.includes(expectedPathPart);
      return hasExpectedPath && (hasMainLandmark || text.trim().length > 120);
    }, { timeout: 120_000 })
    .toBe(true);

  await expect.poll(() => hasGlobalLoader(page), { timeout: 60_000 }).toBe(false);
}

test.describe("community territorial routes", () => {
  test.setTimeout(240_000);

  test("city-level community route resolves", async ({ page }) => {
    await open(page, "/comunidade/ba/salvador");
    await expectRouteResolved(page);
  });

  test("city feed and groups resolve", async ({ page }) => {
    await open(page, "/comunidade/ba/salvador/feed");
    await expectRouteResolved(page);

    await open(page, "/comunidade/ba/salvador/grupos");
    await expectRouteResolved(page);
  });

  test("city social surfaces stay canonical", async ({ page }) => {
    await open(page, "/comunidade/ba/salvador/feed");
    await expectRouteResolved(page);

    await open(page, "/comunidade/ba/salvador/grupos");
    await expectRouteResolved(page);
  });

  test("community sidebar hides paused education surface", async ({ page }) => {
    await open(page, "/comunidade/ba/salvador/feed");
    await expectRouteResolved(page);

    const educationLink = page
      .locator('a[href="/educacao/ba/salvador"]')
      .first();

    await expect(educationLink).toHaveCount(0);

    await open(page, "/educacao/ba/salvador");
    await expect
      .poll(() => bodyText(page), { timeout: 60_000 })
      .toMatch(/MVP publico|MVP público|separado para ajustes/i);
  });
});
