import { expect, test, type Page } from "@playwright/test";

import {
  AUTH_JOURNEY_INTENTS,
  seedAuthFlowState,
} from "./helpers/authFlowState";

const RETURN_PATH = "/mensagens/sabores-da-ana";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test.describe("Google OAuth — recuperação de callback", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthFlowState(page, {
      pendingReturn: RETURN_PATH,
      pendingIntent: AUTH_JOURNEY_INTENTS.login,
    });
  });

  test("cancelamento do Google preserva o destino e oferece retomada segura", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      "/aceitar-termos?error=access_denied&error_description=provider-text-must-not-be-reflected",
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByRole("heading", { name: "Antes de continuar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("alert").getByText("Não foi possível concluir a entrada com Google"),
    ).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await expect(page.getByText("provider-text-must-not-be-reflected")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Voltar e tentar novamente" }),
    ).toHaveAttribute("href", "/login?redirect=%2Fmensagens%2Fsabores-da-ana");
    await expect(page.locator("main#main-content svg")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("erro no fragmento OAuth recebe o mesmo tratamento seguro", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      "/aceitar-termos#error=server_error&error_description=do-not-render-me",
      { waitUntil: "domcontentloaded" },
    );

    await expect(page.getByRole("alert")).toContainText(
      "Não foi possível concluir a entrada com Google",
    );
    await expect(page.getByText("do-not-render-me")).toHaveCount(0);
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("código PKCE órfão não é apagado nem deixa a tela presa em verificação", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/aceitar-termos?code=orphaned-google-code", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("status")).toContainText(
      "Verificando o aceite da sua conta",
    );
    await expect(page.getByRole("alert")).toContainText(
      "Não foi possível concluir a entrada com Google",
      { timeout: 8_000 },
    );
    await expect(page).toHaveURL(/code=orphaned-google-code/);
    await expect(
      page.getByRole("link", { name: "Voltar e tentar novamente" }),
    ).toHaveAttribute("href", "/login?redirect=%2Fmensagens%2Fsabores-da-ana");
    await expectNoHorizontalOverflow(page);
  });
});
