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

test.describe("central canonical routes", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("central, driver and courier routes remain canonical", async ({ page }) => {
    await expectOperationalRoute(page, "/central", /^\/central/);
    await expectOperationalRoute(page, "/central/motorista/corridas", /^\/central\/motorista\/corridas/);
    await expectOperationalRoute(page, "/central/motoboy/entregas", /^\/central\/motoboy\/(entregas|cadastro)/);
  });

  test("legacy create-driver route is not reintroduced", async ({ page }) => {
    await page.goto("/create-driver", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 45_000 }).not.toBe("/create-driver");
  });
});
