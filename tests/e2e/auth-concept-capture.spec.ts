import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { seedAuthFlowState } from "./helpers/authFlowState";

const OUTPUT_DIR = resolve(process.cwd(), "auth-concept-captures");
const RETURN_PATH = "/mensagens/sabores-da-ana";
mkdirSync(OUTPUT_DIR, { recursive: true });

async function prepare(page: Page) {
  await seedAuthFlowState(page, {
    pendingReturn: RETURN_PATH,
    pendingSignupEmail: "ana@example.com",
    pendingSignupRedirect: RETURN_PATH,
  });
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.documentElement.appendChild(style);
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

    await page.goto("/login?redirect=%2Fmensagens%2Fsabores-da-ana", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: "Bom ter você por aqui." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();
    await capture(page, "mobile-login.png");

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Comece pelo seu perfil pessoal." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Você pode se cadastrar de qualquer lugar.", { exact: true }),
    ).toBeVisible();
    await capture(page, "mobile-signup.png");

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Confira seu e-mail" }),
    ).toBeVisible();
    await capture(page, "mobile-confirm-email.png");

    await page.goto("/reset-password?mode=request&email=ana%40example.com", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /Vamos recuperar/ })).toBeVisible();
    await capture(page, "mobile-recovery-request.png");

    await page.goto("/aceitar-termos", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Antes de continuar" }),
    ).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await capture(page, "mobile-terms-signed-out.png");

    await page.goto("/aceitar-termos?error=access_denied", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("alert")).toContainText(
      "Não foi possível concluir a entrada com Google",
    );
    await capture(page, "mobile-google-oauth-cancelled.png");
  });

  test("captures desktop concept screens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/login?redirect=%2Fmensagens%2Fsabores-da-ana", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Seu lugar,\s*mais perto\./ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();
    await capture(page, "desktop-login.png");

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Comece\s*por você\./ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();
    await capture(page, "desktop-signup.png");

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("Só falta confirmar seu e-mail.", { exact: true }),
    ).toBeVisible();
    await capture(page, "desktop-confirm-email.png");

    await page.goto("/reset-password?mode=request&email=ana%40example.com", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByText("Vamos ajudar você a voltar.", { exact: true }),
    ).toBeVisible();
    await capture(page, "desktop-recovery-request.png");

    await page.goto("/aceitar-termos", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Antes de continuar" }),
    ).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await capture(page, "desktop-terms-signed-out.png");

    await page.goto("/aceitar-termos?error=access_denied", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("alert")).toContainText(
      "Não foi possível concluir a entrada com Google",
    );
    await capture(page, "desktop-google-oauth-cancelled.png");
  });
});
