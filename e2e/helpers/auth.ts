import { Page } from "@playwright/test";

// Credenciais de teste — lidas de variáveis de ambiente
export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? "test@example.com",
  password: process.env.E2E_USER_PASSWORD ?? "test123456",
};

export const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "admin123456",
};

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");

  await page.waitForLoadState("domcontentloaded");

  await page.locator("#login-identifier").waitFor({ state: "visible", timeout: 10_000 });
  await page.locator("#login-password").waitFor({ state: "visible", timeout: 10_000 });

  await page.locator("#login-identifier").fill(email);
  await page.locator("#login-password").fill(password);
  const cookieAccept = page.getByRole("button", { name: /aceitar todos/i });
  if (await cookieAccept.isVisible().catch(() => false)) {
    await cookieAccept.click().catch(() => undefined);
  }

  const submitButton = page.getByRole("button", { name: /^Entrar$/i });
  await submitButton.waitFor({ state: "visible", timeout: 10_000 });
  await submitButton.click({ trial: true }).catch(() => undefined);
  await submitButton.click().catch(async () => {
    await page.locator("#login-password").press("Enter");
  });

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

export async function loginAsAdmin(page: Page) {
  return login(page, TEST_ADMIN.email, TEST_ADMIN.password);
}

export async function loginAsUser(page: Page) {
  return login(page, TEST_USER.email, TEST_USER.password);
}
