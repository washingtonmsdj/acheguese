import { expect, test } from "@playwright/test";

const UNIQUE = Date.now();
const EMAIL = `e2e-cadastro-${UNIQUE}@example.com`;
const PASSWORD = "SenhaSegura@2026";

const NAME_LABEL = /Nome completo|^Nome$/i;

test.describe("Cadastro — fluxo account-first", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/auth\/v1\/signup/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e-user", email: EMAIL },
          session: null,
        }),
      });
    });
  });

  test("exibe erros de validação na única tela", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByLabel(/Aceito os Termos/i).check();
    await page.getByRole("button", { name: /Criar minha conta/i }).click();
    await expect(page.getByText(/Nome deve ter pelo menos 3 caracteres/i)).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Estado|Cidade|Bairro/i })).toHaveCount(0);
  });

  test("cria a conta pessoal sem obrigar território e chega à confirmação", async ({ page }) => {
    await page.goto("/cadastro?redirect=%2Fmensagens%2Fabc");

    await page.getByLabel(NAME_LABEL).fill("Ana E2E");
    await page.getByLabel(/Nome de usuário/i).fill(`ana_e2e_${UNIQUE}`);
    await page.getByLabel(/^E-mail$/i).fill(EMAIL);
    await page.getByLabel(/^Senha$/i).fill(PASSWORD);

    const submit = page.getByRole("button", { name: /Criar minha conta/i });
    await expect(submit).toBeDisabled();
    await page.getByLabel(/Aceito os Termos/i).check();
    await expect(submit).toBeEnabled();
    await submit.click();

    await page.waitForURL(/\/cadastro\/confirmacao/, { timeout: 15_000 });
    await expect(page.getByText(EMAIL)).toBeVisible();
  });

  test("mostra erro real quando a API rejeita o cadastro", async ({ page }) => {
    await page.unroute(/\/auth\/v1\/signup/);
    await page.route(/\/auth\/v1\/signup/, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "invalid_request",
          error_description: "User already registered",
          msg: "User already registered",
        }),
      });
    });

    await page.goto("/cadastro");
    await page.getByLabel(NAME_LABEL).fill("Ana Dup");
    await page.getByLabel(/Nome de usuário/i).fill(`ana_dup_${UNIQUE}`);
    await page.getByLabel(/^E-mail$/i).fill(EMAIL);
    await page.getByLabel(/^Senha$/i).fill(PASSWORD);
    await page.getByLabel(/Aceito os Termos/i).check();
    await page.getByRole("button", { name: /Criar minha conta/i }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/cadastro$/);
  });
});
