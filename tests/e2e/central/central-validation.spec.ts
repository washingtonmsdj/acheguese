import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "../../../e2e/helpers/auth";

async function expectOperationalRoute(page: Page, path: string, expected: RegExp) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });

  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          hasMain: Boolean(document.querySelector("main")),
          textLength: document.body.innerText.trim().length,
        })),
      { timeout: 45_000 },
    )
    .toMatchObject({ hasMain: true });

  expect(new URL(page.url()).pathname).toMatch(expected);
}

async function expectPausedRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });

  await expect
    .poll(() => page.locator("body").innerText().catch(() => ""), { timeout: 45_000 })
    .toMatch(/MVP publico|MVP público|separado para ajustes/i);
}

test.describe("central canonical routes", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("central remains canonical and paused mobility routes stay isolated", async ({ page }) => {
    await expectOperationalRoute(page, "/central", /^\/central/);
    await expectPausedRoute(page, "/central/motorista/corridas");
    await expectPausedRoute(page, "/central/motoboy/entregas");
  });

  test("legacy create-driver route stays isolated while mobility is paused", async ({ page }) => {
    await expectPausedRoute(page, "/create-driver");
  });
});
