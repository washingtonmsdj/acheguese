import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const OUTPUT_DIR = resolve(process.cwd(), "auth-concept-captures");
mkdirSync(OUTPUT_DIR, { recursive: true });

async function prepare(page: Page) {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("auth.pending-signup-email", "ana@example.com");
      window.sessionStorage.setItem("auth.pending-signup-redirect", "/mensagens/sabores-da-ana");
      const style = document.createElement("style");
      style.textContent = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}`;
      document.documentElement.appendChild(style);
    } catch {}
  });
}

async function capture(page: Page, filename: string) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(OUTPUT_DIR, filename), fullPage: true });
}

test.describe("Auth concept capture", () => {
  test.beforeEach(async ({ page }) => prepare(page));

  test("captures mobile concept screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/login?redirect=%2Fmensagens%2Fsabores-da-ana", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Bom ter você por aqui." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
    await capture(page, "mobile-login.png");

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Comece pelo seu perfil pessoal." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
    await capture(page, "mobile-signup.png");

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await capture(page, "mobile-confirm-email.png");

    await page.goto("/reset-password?mode=request&email=ana%40example.com", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Vamos recuperar/ })).toBeVisible();
    await capture(page, "mobile-recovery-request.png");
  });

  test("captures desktop concept screens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/login?redirect=%2Fmensagens%2Fsabores-da-ana", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Seu lugar, mais perto.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
    await capture(page, "desktop-login.png");

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Comece por você.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
    await capture(page, "desktop-signup.png");

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Só falta confirmar seu e-mail.", { exact: true })).toBeVisible();
    await capture(page, "desktop-confirm-email.png");

    await page.goto("/reset-password?mode=request&email=ana%40example.com", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Vamos ajudar você a voltar.", { exact: true })).toBeVisible();
    await capture(page, "desktop-recovery-request.png");
  });
});
