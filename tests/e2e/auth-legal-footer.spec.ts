/**
 * Auth Legal Footer E2E
 *
 * Garante que todas as páginas de autenticação exibem o rodapé legal
 * (Termos, Privacidade, Suporte) — requisito LGPD e App Store review.
 *
 * Também valida que a skip-link de acessibilidade está presente e aponta
 * para `#main-content` em cada tela pública de auth.
 */
import { expect, test } from "@playwright/test";

const AUTH_ROUTES = [
  { path: "/login", label: "Login" },
  { path: "/cadastro", label: "Cadastro" },
  { path: "/reset-password?expired=1", label: "Reset Password" },
];

for (const route of AUTH_ROUTES) {
  test(`${route.label} exibe rodapé legal e skip-link`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });

    // Skip-link a11y (fica sr-only até receber foco).
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);

    // Rodapé legal com os 3 links canônicos.
    const footer = page.getByRole("contentinfo").or(page.locator("footer")).first();
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link", { name: /termos de uso/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /política de privacidade/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /suporte/i })).toBeVisible();
  });
}
