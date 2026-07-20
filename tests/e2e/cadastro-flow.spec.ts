/**
 * E2E — Fluxo de cadastro (/cadastro)
 *
 * Cobre:
 *  - Validação de dados inválidos exibindo mensagens do Zod.
 *  - Fluxo completo (dados → território → aceite → submit) chegando na tela
 *    de confirmação (/cadastro/confirmacao).
 *
 * O teste intercepta chamadas ao Supabase Auth para não depender de rede real
 * e usa um e-mail único por execução para simular usuário novo.
 */

import { expect, test } from "@playwright/test";

const UNIQUE = Date.now();
const EMAIL = `e2e-cadastro-${UNIQUE}@example.com`;
const PASSWORD = "SenhaSegura@2026";

test.describe("Cadastro — fluxo completo", () => {
  test.beforeEach(async ({ page }) => {
    // Intercepta signUp: simula sucesso sem depender de Supabase real
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

  test("exibe erros de validação para dados inválidos", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByRole("button", { name: /Próximo/i }).click();
    await expect(
      page.getByText(/Nome deve ter pelo menos 3 caracteres/i),
    ).toBeVisible();
  });

  test("completa o cadastro e chega na tela de confirmação", async ({
    page,
  }) => {
    await page.goto("/cadastro");

    // Step 0 — dados pessoais
    await page.getByLabel(/Nome completo/i).fill("Ana E2E");
    await page.getByLabel(/Nome de usuario/i).fill(`ana_e2e_${UNIQUE}`);
    await page.getByLabel(/^Email/i).fill(EMAIL);
    await page.getByLabel(/^Senha/i).fill(PASSWORD);
    await page.getByLabel(/Confirmar senha/i).fill(PASSWORD);
    await page.getByRole("button", { name: /Próximo/i }).click();

    // Step 1 — território (usa primeira opção disponível de cada select)
    await page.getByLabel(/Estado/i).click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/Cidade/i).click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/Bairro/i).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Próximo/i }).click();

    // Step 2 — aceite dos termos
    const submit = page.getByRole("button", { name: /Criar minha conta/i });
    await expect(submit).toBeDisabled();

    await page.getByLabel(/Li e aceito os Termos/i).check();
    await expect(submit).toBeEnabled();
    await submit.click();

    await page.waitForURL(/\/cadastro\/confirmacao/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/cadastro\/confirmacao/);
  });

  test("mostra erro amigável quando a API rejeita o cadastro", async ({
    page,
  }) => {
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
    await page.getByLabel(/Nome completo/i).fill("Ana Dup");
    await page.getByLabel(/Nome de usuario/i).fill(`ana_dup_${UNIQUE}`);
    await page.getByLabel(/^Email/i).fill(EMAIL);
    await page.getByLabel(/^Senha/i).fill(PASSWORD);
    await page.getByLabel(/Confirmar senha/i).fill(PASSWORD);
    await page.getByRole("button", { name: /Próximo/i }).click();

    await page.getByLabel(/Estado/i).click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/Cidade/i).click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/Bairro/i).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Próximo/i }).click();

    await page.getByLabel(/Li e aceito os Termos/i).check();
    await page.getByRole("button", { name: /Criar minha conta/i }).click();

    await expect(page.getByText(/já está cadastrado/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
