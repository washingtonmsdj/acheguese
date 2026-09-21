import { expect, test } from "@playwright/test";

import { seedAuthFlowState } from "./helpers/authFlowState";

const SIGNUP_EMAIL = "moradora@example.com";
const RETURN_PATH = "/mensagens/business/44444444-4444-4444-8444-444444444444";

test.describe("confirmação de e-mail — recuperação de callback", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthFlowState(page, {
      pendingSignupEmail: SIGNUP_EMAIL,
      pendingSignupRedirect: RETURN_PATH,
    });
  });

  test("código PKCE órfão não vira falso sucesso e retorna para a confirmação recuperável", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login?confirmed=1&code=orphaned-confirmation-code", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("status")).toContainText(
      "Confirmando seu e-mail",
    );
    await expect(page.getByText("E-mail confirmado.")).toHaveCount(0);

    await expect(page).toHaveURL(/\/cadastro\/confirmacao$/, {
      timeout: 8_000,
    });
    await expect(
      page.getByRole("heading", { name: "Confira seu e-mail" }),
    ).toBeVisible();
    await expect(page.getByText(SIGNUP_EMAIL, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reenviar e-mail" }),
    ).toBeVisible();
  });

  test("erro de confirmação não é confundido com recuperação de senha", async ({
    page,
  }) => {
    await page.goto(
      "/login?confirmed=1#error=access_denied&error_code=otp_expired",
      { waitUntil: "domcontentloaded" },
    );

    await expect(page).toHaveURL(/\/cadastro\/confirmacao$/);
    await expect(page).not.toHaveURL(/reset-password/);
    await expect(page.getByText(SIGNUP_EMAIL, { exact: true })).toBeVisible();
  });
});

test.describe("troca de e-mail da conta — callback dedicado", () => {
  test("código PKCE órfão permanece na superfície de troca de e-mail e falha de forma recuperável", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      "/conta/confirmar-email?emailChange=1&code=orphaned-email-change-code",
      { waitUntil: "domcontentloaded" },
    );

    await expect(page.getByRole("status")).toContainText(
      "Confirmando seu novo e-mail",
    );
    await expect(
      page.getByRole("heading", {
        name: "Não foi possível concluir esta confirmação",
      }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/conta\/confirmar-email\?emailChange=1/);
    await expect(page).not.toHaveURL(/cadastro\/primeiro-acesso/);
    await expect(page).not.toHaveURL(/reset-password/);
  });

  test("OTP expirado da troca de e-mail não é reclassificado como recovery ou signup", async ({
    page,
  }) => {
    await page.goto(
      "/conta/confirmar-email?emailChange=1#error=access_denied&error_code=otp_expired",
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByRole("heading", {
        name: "Não foi possível concluir esta confirmação",
      }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/conta\/confirmar-email\?emailChange=1/);
    await expect(page).not.toHaveURL(/reset-password/);
    await expect(page).not.toHaveURL(/cadastro\/confirmacao/);
  });
});
