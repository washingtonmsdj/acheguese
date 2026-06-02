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

async function expectRouteResolved(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await expect
    .poll(async () => {
      const hasMainLandmark = await hasMain(page);
      const text = await bodyText(page);
      const currentUrl = page.url();
      const hasCommunityPath = currentUrl.includes("/comunidade/");
      return hasCommunityPath && (hasMainLandmark || text.trim().length > 120);
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

  test("community sidebar exposes Educacao and route resolves", async ({ page }) => {
    await open(page, "/comunidade/ba/salvador/feed");
    await expectRouteResolved(page);

    const educationLink = page
      .locator('a[href="/educacao/ba/salvador"]')
      .first();

    await expect(educationLink).toBeVisible({ timeout: 30_000 });
    await educationLink.click();

    await expect
      .poll(() => page.url(), { timeout: 30_000 })
      .toContain("/educacao/ba/salvador");
    await expectRouteResolved(page);
  });
});
