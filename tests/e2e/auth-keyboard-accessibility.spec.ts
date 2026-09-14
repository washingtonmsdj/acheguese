import { expect, test } from "@playwright/test";

test.describe("Conta e acesso — teclado e foco", () => {
  test("login mantém ordem de foco útil e controles de senha operáveis", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    const identifier = page.getByLabel("E-mail ou @usuário");
    const password = page.getByLabel("Senha", { exact: true });
    const showPassword = page.getByRole("button", { name: "Mostrar senha" });

    await identifier.focus();
    await expect(identifier).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(password).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(showPassword).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Ocultar senha" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("Shift+Tab");
    await expect(password).toBeFocused();
  });

  test("esqueci minha senha funciona por teclado e preserva e-mail digitado", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await page.getByLabel("E-mail ou @usuário").fill("ana@example.com");
    const forgot = page.getByRole("button", { name: "Esqueci minha senha" });
    await forgot.focus();
    await expect(forgot).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/reset-password\?mode=request&email=ana%40example\.com$/);
    await expect(page.getByRole("heading", { name: /Vamos recuperar/ })).toBeVisible();
  });

  test("Google e ações principais expõem nomes acessíveis e foco nativo", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loginGoogle = page.getByRole("button", { name: "Continuar com Google" });
    await loginGoogle.focus();
    await expect(loginGoogle).toBeFocused();
    await expect(loginGoogle).toBeEnabled();

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    const signupGoogle = page.getByRole("button", { name: "Continuar com Google" });
    await signupGoogle.focus();
    await expect(signupGoogle).toBeFocused();
    await expect(signupGoogle).toBeEnabled();
    await expect(page.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  test("retomada de erro OAuth é alcançável e ativável pelo teclado", async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("auth.pending-return-path", "/mensagens/sabores-da-ana");
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/aceitar-termos?error=access_denied", {
      waitUntil: "domcontentloaded",
    });

    const retry = page.getByRole("link", { name: "Voltar e tentar novamente" });
    await retry.focus();
    await expect(retry).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/login\?redirect=%2Fmensagens%2Fsabores-da-ana$/);
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
  });
});