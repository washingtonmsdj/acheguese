/**
 * E2E — /login PasswordInput
 *
 * Valida que o campo de senha na página de login:
 *  - Não exibe a checklist de requisitos (showRequirements={false}).
 *  - Exibe apenas a barra de força quando o usuário digita.
 *  - Reage dinamicamente ao valor digitado, aumentando o nível da barra.
 *  - Permite alternar visibilidade (mostrar/ocultar) via botão toggle.
 */

import { expect, test, type Page } from "@playwright/test";

const PASSWORD_STRONG = "SenhaSegura@2026";

async function gotoLogin(page: Page) {
  await page.goto("/login");
  await page.locator("#login-password").waitFor({ state: "visible", timeout: 30_000 });
}

test.describe("/login — PasswordInput", () => {
  test("não renderiza checklist de requisitos, apenas a barra de força", async ({ page }) => {
    await gotoLogin(page);
    const passwordInput = page.locator("#login-password");

    // Sem valor digitado → nem barra nem checklist devem aparecer.
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(page.getByText(/Mínimo de \d+ caracteres/i)).toHaveCount(0);
    await expect(page.getByText(/Pelo menos uma letra maiúscula/i)).toHaveCount(0);

    // Ao digitar, a barra aparece — mas os itens da checklist NUNCA devem aparecer.
    await passwordInput.fill("abc");
    await expect(page.getByText(/Pelo menos uma letra maiúscula/i)).toHaveCount(0);
    await expect(page.getByText(/Pelo menos um número/i)).toHaveCount(0);
    await expect(page.getByText(/Pelo menos um caractere especial/i)).toHaveCount(0);
    await expect(page.getByText(/Mínimo de \d+ caracteres/i)).toHaveCount(0);

    // <ul> de requisitos não deve existir dentro do wrapper do PasswordInput.
    const passwordWrapper = passwordInput.locator("xpath=ancestor::div[contains(@class,'space-y-2')][1]");
    await expect(passwordWrapper.locator("ul li")).toHaveCount(0);
  });

  test("mostra a barra de força e reage à qualidade da senha", async ({ page }) => {
    await gotoLogin(page);
    const passwordInput = page.locator("#login-password");
    const wrapper = passwordInput.locator(
      "xpath=ancestor::div[contains(@class,'space-y-2')][1]",
    );

    // Senha fraca: rótulo "Fraca" visível.
    await passwordInput.fill("abc");
    await expect(wrapper.getByText(/Fraca/i)).toBeVisible();

    // Senha forte: rótulo evolui para "Forte" e ainda sem checklist.
    await passwordInput.fill(PASSWORD_STRONG);
    await expect(wrapper.getByText(/Forte/i)).toBeVisible();
    await expect(wrapper.locator("ul li")).toHaveCount(0);
  });

  test("botão de mostrar/ocultar alterna o tipo do input", async ({ page }) => {
    await gotoLogin(page);
    const passwordInput = page.locator("#login-password");
    await passwordInput.fill(PASSWORD_STRONG);
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: /mostrar senha/i }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: /ocultar senha/i }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
