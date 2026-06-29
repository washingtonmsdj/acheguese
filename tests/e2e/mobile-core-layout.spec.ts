import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 360, height: 800 };
const NAVIGATION_TIMEOUT_MS = 90_000;
const CONTENT_TIMEOUT_MS = 60_000;

test.setTimeout(120_000);

async function assertCoreMobileLayout(page: import("@playwright/test").Page, path: string) {
  await page.setViewportSize(MOBILE_VIEWPORT);
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "commit", timeout: NAVIGATION_TIMEOUT_MS });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1_500);
    }
  }

  await expect
    .poll(
      async () => {
        const mainVisible = await page.locator("main").first().isVisible().catch(() => false);
        const hasText = await page
          .evaluate(() => (document.body?.innerText ?? "").trim().length > 80)
          .catch(() => false);
        return mainVisible || hasText;
      },
      { timeout: CONTENT_TIMEOUT_MS },
    )
    .toBe(true);

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });
  expect(hasHorizontalOverflow).toBe(false);
}

test.describe("Mobile core public layout", () => {
  test("landing principal em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/");
  });

  test("login em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/login");
  });

  test("cadastro em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/cadastro");
  });

  test("sobre em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/sobre");
  });

  test("contato em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/contato");
  });

  test("servicos territorial em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/servicos/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  test("termos em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/termos");
  });

  test("regras em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/regras");
  });

  test("privacidade em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/privacidade");
  });

  test("dpo em 360px", async ({ page }) => {
    await assertCoreMobileLayout(page, "/dpo");
  });
});
