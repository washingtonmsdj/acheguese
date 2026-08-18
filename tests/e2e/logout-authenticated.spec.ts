import { expect, test, type Page } from "@playwright/test";
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

async function gotoCentral(page: Page) {
  await page.goto("/central", {
    waitUntil: "commit",
    timeout: 60_000,
  });
}

test.describe("Logout autenticado — contrato determinístico", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhum segredo padrão é inventado.",
  );

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: encerra a sessão local e protege a Central novamente`, async ({
      page,
    }) => {
      const credentials = requireE2EUserCredentials();

      await page.setViewportSize(viewport);
      await page.context().clearCookies();

      // `commit` avoids making the first cold Vite navigation depend on every
      // document resource reaching DOMContentLoaded. The URL assertions below
      // still prove that the SPA guard actually booted and redirected.
      await gotoCentral(page);
      await expect(page).toHaveURL(/\/login\?redirect=%2Fcentral$/, {
        timeout: 60_000,
      });

      await bootstrapFixtureSession(
        page,
        credentials.email,
        credentials.password,
      );

      await gotoCentral(page);
      await expect(page).toHaveURL(/\/central(?:\?|$)/, { timeout: 30_000 });

      const logoutButton = page.getByRole("button", { name: "Sair da conta" });
      await expect(logoutButton).toBeVisible({ timeout: 30_000 });
      await logoutButton.click();

      await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });

      await gotoCentral(page);
      await expect(page).toHaveURL(/\/login\?redirect=%2Fcentral$/, {
        timeout: 60_000,
      });
    });
  }
});
