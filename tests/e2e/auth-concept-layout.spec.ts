import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectNoGenericSvgInMain(page: import("@playwright/test").Page) {
  await expect(page.locator("main#main-content svg")).toHaveCount(0);
}

test.describe("Conta e acesso — contrato visual responsivo do concept", () => {
  test("mobile mantém a composição de uma coluna do concept", async ({ page }) => {
    await page.setViewportSize(MOBILE);

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Bom ter você por aqui." })).toBeVisible();
    await expect(page.locator('img[src="/auth/login-hero.webp"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Comece pelo seu perfil pessoal." })).toBeVisible();
    await expect(page.locator('img[src="/auth/signup-hero.webp"]')).toBeHidden();
    await expect(page.getByLabel("Nome de usuário")).toBeVisible();
    await expect(page.getByLabel("Confirmar senha")).toHaveCount(0);
    await expect(page.getByLabel("Estado")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await expect(page.locator('img[src="/auth/confirm-envelope.webp"]')).toBeVisible();
    await expect(page.locator('img[src="/auth/confirm-hero.webp"]')).toBeHidden();
    await expect(page.getByText("Toque em Confirmar e-mail.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/reset-password?mode=request", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Vamos recuperar/ })).toBeVisible();
    await expect(page.locator('img[src="/auth/recovery-hero.webp"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Voltar" })).toContainText("Voltar");
    await expect(page.getByRole("button", { name: "Enviar link de recuperação" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);
  });

  test("desktop usa arte oficial à esquerda e card funcional à direita", async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    const cases = [
      {
        path: "/login",
        heading: /Seu lugar,\s*mais perto\./,
        asset: "/auth/login-hero.webp",
        cardHeading: "Entre na sua conta",
      },
      {
        path: "/cadastro",
        heading: /Comece\s*por você\./,
        asset: "/auth/signup-hero.webp",
        cardHeading: "Criar minha conta",
      },
      {
        path: "/cadastro/confirmacao",
        heading: /Só falta\s*confirmar\s*seu e-mail\./,
        asset: "/auth/confirm-hero.webp",
        cardHeading: "Confira sua caixa de entrada",
      },
      {
        path: "/reset-password?mode=request",
        heading: /Vamos ajudar\s*você a voltar\./,
        asset: "/auth/recovery-hero.webp",
        cardHeading: "E-mail cadastrado",
      },
    ] as const;

    for (const current of cases) {
      await page.goto(current.path, { waitUntil: "domcontentloaded" });

      const main = page.locator("main#main-content");
      await expect(main).toBeVisible();
      const hero = main.locator(`img[src="${current.asset}"]`);
      await expect(hero).toBeVisible();
      await expect(page.getByRole("heading", { name: current.heading })).toBeVisible();
      await expect(page.getByText(current.cardHeading, { exact: true })).toBeVisible();

      const sections = main.locator(":scope > section");
      await expect(sections).toHaveCount(2);
      const leftBox = await sections.nth(0).boundingBox();
      const rightBox = await sections.nth(1).boundingBox();
      expect(leftBox).not.toBeNull();
      expect(rightBox).not.toBeNull();
      expect(leftBox!.x).toBeLessThan(rightBox!.x);
      expect(rightBox!.width).toBeGreaterThanOrEqual(390);
      expect(rightBox!.width).toBeLessThanOrEqual(450);

      await expectNoHorizontalOverflow(page);
      await expectNoGenericSvgInMain(page);
    }
  });

  test("desktop e mobile não estouram o viewport nos limites próximos ao breakpoint", async ({ page }) => {
    for (const width of [320, 360, 390, 430, 767, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expectNoHorizontalOverflow(page);
    }
  });
});
