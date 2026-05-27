import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "../../e2e/helpers/auth";

const TEST_EMAIL = process.env.E2E_USER_EMAIL || "";
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || "";

function hasAuthEnv(): boolean {
  return Boolean(TEST_EMAIL && TEST_PASSWORD);
}

async function selectFirstEnabledOptionFromTrigger(trigger: ReturnType<Page["locator"]>): Promise<void> {
  await trigger.click();
  await trigger.press("ArrowDown");
  await trigger.press("Enter");
}

async function selectTerritory(page: Page): Promise<void> {
  await selectFirstEnabledOptionFromTrigger(page.locator("#territorial-state"));

  await selectFirstEnabledOptionFromTrigger(page.locator("#territorial-city"));

  const neighborhoodTrigger = page.locator("#territorial-neighborhood");
  await expect(neighborhoodTrigger).toBeVisible({ timeout: 20_000 });
  await expect(neighborhoodTrigger).toBeEnabled({ timeout: 20_000 });
  await selectFirstEnabledOptionFromTrigger(neighborhoodTrigger);
  await expect(neighborhoodTrigger).not.toContainText("Selecione o bairro");
}

test.describe("Business Create Form", () => {
  test.skip(!hasAuthEnv(), "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para executar.");

  test("continuar avanca do passo 1 para 2 e do passo 2 para 3", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsUser(page);
    await page.goto("/central/empresas/nova/educacao", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(
      page.getByRole("heading", { name: "Cadastrar instituicao de ensino" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.locator("#name").fill(`E2E Escola Fluxo ${Date.now()}`);
    await page
      .locator("#description")
      .fill("Cadastro E2E para validar avanço de etapas do formulário sem travamento.");

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByRole("heading", { name: "Território, contato e operação" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.locator("#phone").fill("(71) 99999-9999");
    await selectTerritory(page);

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByRole("heading", { name: "Mídia, canais públicos e operação complementar" }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
