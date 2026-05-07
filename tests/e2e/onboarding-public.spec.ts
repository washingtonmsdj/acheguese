import { expect, test, type Page } from "@playwright/test";

async function openPublicRoute(page: Page, path: string) {
  await page.goto(path, {
    timeout: 15_000,
    waitUntil: "commit",
  });
}

async function readBodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

async function hasMainContent(page: Page) {
  return page.evaluate(() => Boolean(document.querySelector("main#main-content"))).catch(() => false);
}

async function readTitle(page: Page) {
  return page.title().catch(() => "");
}

test.describe("public onboarding routes", () => {
  test.setTimeout(120_000);

  test.beforeAll(async ({ browser, baseURL }) => {
    const page = await browser.newPage();
    await page
      .goto(`${baseURL ?? ""}/cadastro/confirmacao`, {
        timeout: 15_000,
        waitUntil: "commit",
      })
      .catch(() => undefined);
    await page.waitForTimeout(20_000);
    await page.close();
  });

  test("signup confirmation route keeps brand copy and accessible main content", async ({ page }) => {
    await openPublicRoute(page, "/cadastro/confirmacao");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Confirme seu email|Procure o email do Achegue-se/i);
    await expect
      .poll(() => hasMainContent(page), { timeout: 30_000 })
      .toBe(true);
  });

  test("signup route uses the product brand and resolves beyond the global suspense loader", async ({ page }) => {
    await openPublicRoute(page, "/cadastro/confirmacao");
    await expect
      .poll(() => hasMainContent(page), { timeout: 60_000 })
      .toBe(true);

    await openPublicRoute(page, "/cadastro");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Achegue-se|Crie sua conta/i);
    await expect
      .poll(() => hasMainContent(page), { timeout: 30_000 })
      .toBe(true);
    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa para você se achegar"))
      .toBe(false);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe("Criar conta | Achegue-se");
  });

  test("login route exposes branded title and accessible main landmark", async ({ page }) => {
    await openPublicRoute(page, "/login");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Bem-vindo de volta|Entrar/i);
    await expect
      .poll(() => hasMainContent(page), { timeout: 30_000 })
      .toBe(true);
    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa para você se achegar"))
      .toBe(false);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe("Entrar | Achegue-se");
  });
});
