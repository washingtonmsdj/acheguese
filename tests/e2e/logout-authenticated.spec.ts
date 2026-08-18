import { expect, test } from "@playwright/test";
import {
  bootstrapFixtureSession,
  hasE2EUserCredentials,
  requireE2EUserCredentials,
} from "../../e2e/helpers/auth";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1000 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

test.setTimeout(120_000);

test.describe("Logout autenticado — contrato determinístico", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhum segredo padrão é inventado.",
  );

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto("/login", {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await expect(page.locator("#login-identifier")).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await page.close();
    }
  });

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: encerra a sessão local e protege a Central novamente`, async ({
      page,
    }) => {
      const credentials = requireE2EUserCredentials();

      await page.setViewportSize(viewport);
      await page.context().clearCookies();

      await page.goto("/login", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await expect(page.locator("#login-identifier")).toBeVisible({
        timeout: 30_000,
      });

      await bootstrapFixtureSession(
        page,
        credentials.email,
        credentials.password,
      );

      await page.goto("/central", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await expect(page).toHaveURL(/\/central(?:\?|$)/, { timeout: 30_000 });

      const logoutButton = page.getByRole("button", { name: "Sair da conta" });
      await expect(logoutButton).toBeVisible({ timeout: 30_000 });
      await logoutButton.click();

      await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });

      await page.goto("/central", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await expect(page).toHaveURL(/\/login\?redirect=%2Fcentral$/, {
        timeout: 30_000,
      });
    });
  }
});
