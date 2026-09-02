import { expect, test, type Page } from "@playwright/test";
import {
  bootstrapFixtureSession,
  bootstrapProtectedPreviewAccess,
  hasE2EUserCredentials,
  requireE2EUserCredentials,
} from "./helpers/auth";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, navigation: "mobile" },
  { name: "tablet", width: 820, height: 1000, navigation: "tablet" },
  { name: "desktop", width: 1440, height: 1000, navigation: "desktop" },
] as const;

const ACCOUNT_ROUTES = [
  { path: "/conta", expected: /\/conta(?:\?|$)/, heading: /^Conta$/ },
  {
    path: "/conta/editar",
    expected: /\/conta\/editar\/[^/?#]+(?:\?|$)/,
    heading: /Editar perfil/i,
  },
  {
    path: "/conta/preferencias",
    expected: /\/conta\/preferencias(?:\?|$)/,
    heading: /Preferências da conta/i,
  },
  {
    path: "/conta/enderecos",
    expected: /\/conta\/enderecos(?:\?|$)/,
    heading: /Meus endereços/i,
  },
  {
    path: "/conta/seguranca",
    expected: /\/conta\/seguranca(?:\?|$)/,
    heading: /Segurança da conta/i,
  },
] as const;

test.setTimeout(180_000);

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test.describe("Conta autenticada — fixture remota determinística", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhum segredo padrão é inventado.",
  );

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: login, Conta, rotas privadas e logout`, async ({
      page,
    }, testInfo) => {
      const credentials = requireE2EUserCredentials();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const networkErrors: string[] = [];

      page.on("console", (message) => {
        const isTurnstileConsoleNoise = message
          .text()
          .includes("font-size:0;color:transparent");
        const isBlockedAdSenseProbe = message
          .text()
          .includes("csi.gstatic.com/csi");
        if (
          message.type() === "error" &&
          !isTurnstileConsoleNoise &&
          !isBlockedAdSenseProbe
        ) {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("response", async (response) => {
        const status = response.status();
        const url = response.url();

        if (status >= 500) {
          networkErrors.push(`${status} ${url}`);
          return;
        }

        if (status >= 400 && url.includes("/functions/v1/role-rpc")) {
          let detail = "";
          try {
            detail = (await response.text()).trim().slice(0, 1_000);
          } catch {
            // Preserve the status + URL evidence even if the response body is unavailable.
          }
          networkErrors.push(
            detail ? `${status} ${url} :: ${detail}` : `${status} ${url}`,
          );
        }
      });
      page.on("requestfailed", (request) => {
        const reason = request.failure()?.errorText ?? "request failed";
        const isTurnstileChallengeProbe =
          request.url().includes(".challenges.cloudflare.com/") &&
          reason.includes("ERR_NAME_NOT_RESOLVED");
        if (!reason.includes("ERR_ABORTED") && !isTurnstileChallengeProbe) {
          networkErrors.push(`${reason} ${request.url()}`);
        }
      });

      await page.setViewportSize(viewport);
      await page.context().clearCookies();
      await bootstrapProtectedPreviewAccess(page);
      await page.goto("/conta", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login\?redirect=%2Fconta$/);
      await expect(page.locator("#login-identifier")).toBeVisible({
        timeout: 30_000,
      });
      await bootstrapFixtureSession(page, credentials.email, credentials.password);
      await expect(page).toHaveURL(/\/conta(?:\?|$)/, { timeout: 30_000 });

      for (const route of ACCOUNT_ROUTES) {
        await test.step(`abre ${route.path} sem mutation destrutiva`, async () => {
          if (route.path === "/conta/editar") {
            await page.goto("/conta", { waitUntil: "domcontentloaded" });
            await page.getByRole("button", { name: /^Editar$/i }).click();
          } else {
            await page.goto(route.path, { waitUntil: "domcontentloaded" });
          }
          await expect(page).toHaveURL(route.expected, { timeout: 30_000 });
          await expect(page.locator("main").first()).toBeVisible({
            timeout: 30_000,
          });
          await expect(
            page.getByRole("heading", { name: route.heading }).first(),
          ).toBeVisible({ timeout: 30_000 });
          await expect(page.locator("body")).not.toContainText(
            /não foi possível carregar/i,
          );
          await expectNoHorizontalOverflow(page);
        });
      }

      await test.step("Conta -> Empresas e vínculos abre a Central canônica", async () => {
        await page.goto("/conta", { waitUntil: "domcontentloaded" });
        await expect(
          page.getByRole("heading", { name: "Empresas e vínculos" }),
        ).toBeVisible({ timeout: 30_000 });
        await page.getByRole("button", { name: "Abrir Central" }).click();
        await expect(page).toHaveURL(/\/central\/empresas(?:\?|$)/, {
          timeout: 30_000,
        });
        await expect(page.getByText("Nenhuma empresa ativa")).toBeVisible({
          timeout: 30_000,
        });
        await page.goto("/conta", { waitUntil: "domcontentloaded" });
      });

      await page.goto("/conta", { waitUntil: "domcontentloaded" });
      const visibleNavigation = page.locator(
        `[data-territory-navigation="${viewport.navigation}"]:visible`,
      );
      await expect(visibleNavigation).toHaveCount(1);
      await expect(
        page.getByRole("navigation", { name: /seções do perfil/i }),
      ).toHaveCount(0);

      const accountItem = visibleNavigation.locator(
        '[data-bottom-nav-item="conta"]',
      );
      if (viewport.navigation === "mobile") {
        const accountBox = await accountItem.boundingBox();
        expect(accountBox?.height ?? 0).toBeGreaterThanOrEqual(44);

        const communityLabel = visibleNavigation
          .locator('[data-bottom-nav-item="community"] span')
          .last();
        const communityFits = await communityLabel.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        );
        expect(communityFits).toBe(true);
      }

      await testInfo.attach(`conta-${viewport.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });

      // Prefer the structured network evidence first so a role-rpc 4xx reports
      // status + URL + response body instead of being shadowed by Chromium's
      // generic console "Failed to load resource" message.
      expect(networkErrors, networkErrors.join("\n")).toEqual([]);
      expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);

      await page.goto("/central", { waitUntil: "domcontentloaded" });
      const accountMenu = page.getByRole("button", {
        name: "Sair da conta",
      });
      await expect(accountMenu).toBeVisible({ timeout: 30_000 });
      await accountMenu.click();
      await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });

      await page.goto("/conta", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login\?redirect=%2Fconta$/, {
        timeout: 30_000,
      });

      expect(pageErrors, pageErrors.join("\n")).toEqual([]);
    });
  }
});