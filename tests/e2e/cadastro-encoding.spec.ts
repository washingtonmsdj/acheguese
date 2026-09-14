import { expect, test } from "@playwright/test";

const UNIQUE = Date.now();
const EMAIL = `e2e-encoding-${UNIQUE}@example.com`;
const PASSWORD = "SenhaSegura@2026";

test.describe("Cadastro — encoding da identidade", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/auth\/v1\/signup/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e-user", email: EMAIL },
          session: null,
        }),
      }),
    );
  });

  test("preserva nome com acentos e não exige território no cadastro inicial", async ({ page }) => {
    await page.goto("/cadastro");

    await expect(page.getByText(/Comece pelo seu perfil pessoal/i)).toBeVisible();
    await page.getByLabel(/^Nome$/i).fill("Ana Conceição");
    await page.getByLabel(/Nome de usuário/i).fill(`ana_enc_${UNIQUE}`);
    await page.getByLabel(/^E-mail$/i).fill(EMAIL);
    await page.getByLabel(/^Senha$/i).fill(PASSWORD);
    await page.getByLabel(/Aceito os Termos/i).check();

    await expect(page.getByText("Ana Conceição")).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: /Estado|Cidade|Bairro/i })).toHaveCount(0);
    await page.getByRole("button", { name: /Criar minha conta/i }).click();

    await page.waitForURL(/\/cadastro\/confirmacao/, { timeout: 15_000 });
    await expect(page.getByText(EMAIL)).toBeVisible();
    await expect(page.locator("body")).not.toContainText("ConceiÃ");
  });
});
