import { expect, test, type Page } from "@playwright/test";

import { seedAuthFlowState } from "./helpers/authFlowState";

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const AUTH_RETURN_PATH = "/mensagens/sabores-da-ana";

async function prepareAuthVisualState(page: Page) {
  await seedAuthFlowState(page, {
    pendingReturn: AUTH_RETURN_PATH,
    pendingSignupEmail: "ana@example.com",
    pendingSignupRedirect: AUTH_RETURN_PATH,
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectConceptViewportFit(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));
  // A prancha aprovada de Entrar/Criar conta cabe inteira em 390x844. Um pixel
  // de arredondamento é tolerado, mas uma segunda dobra não pertence ao concept.
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);
}

async function expectNoGenericSvgInMain(page: Page) {
  await expect(page.locator("main#main-content svg")).toHaveCount(0);
}

test.describe("Conta e acesso — contrato visual responsivo do concept", () => {
  test.beforeEach(async ({ page }) => prepareAuthVisualState(page));

  test("mobile mantém a composição de uma coluna do concept", async ({ page }) => {
    await page.setViewportSize(MOBILE);

    await page.goto("/login?redirect=%2Fmensagens%2Fsabores-da-ana", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: "Bom ter você por aqui." }),
    ).toBeVisible();
    await expect(page.getByText("Você voltará para", { exact: true })).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await expect(page.locator('img[src="/auth/login-hero.webp"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectConceptViewportFit(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Comece pelo seu perfil pessoal." }),
    ).toBeVisible();
    await expect(page.locator('img[src="/auth/signup-hero.webp"]')).toBeHidden();
    await expect(page.getByLabel("Nome de usuário")).toBeVisible();
    await expect(page.getByText("Seu identificador público.", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Você pode se cadastrar de qualquer lugar.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Confirmar senha")).toHaveCount(0);
    await expect(page.getByLabel("Estado")).toHaveCount(0);
    // O concept mobile de criação não possui uma etapa OAuth paralela. O Google
    // continua disponível no card desktop sem alterar a composição aprovada.
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectConceptViewportFit(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/cadastro/confirmacao", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Confira seu e-mail" }),
    ).toBeVisible();
    await expect(page.locator('img[src="/auth/confirm-envelope.webp"]')).toBeVisible();
    await expect(page.locator('img[src="/auth/confirm-hero.webp"]')).toBeHidden();
    await expect(page.getByText("Toque em Confirmar e-mail.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/reset-password?mode=request", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Vamos recuperar/ })).toBeVisible();
    await expect(page.locator('img[src="/auth/recovery-hero.webp"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Voltar", exact: true })).toContainText("Voltar");
    await expect(
      page.getByRole("button", { name: "Enviar link de recuperação" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);

    await page.goto("/aceitar-termos", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Antes de continuar" }),
    ).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar para entrar" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fmensagens%2Fsabores-da-ana",
    );
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);
  });

  test("desktop usa arte oficial grande à esquerda e card funcional à direita", async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    const cases = [
      {
        path: "/login",
        heading: /Seu lugar,\s*mais perto\./,
        asset: "/auth/login-hero.webp",
        cardHeading: "Entre na sua conta",
        minHeroWidth: 520,
      },
      {
        path: "/cadastro",
        heading: /Comece\s*por você\./,
        asset: "/auth/signup-hero.webp",
        cardHeading: "Criar minha conta",
        minHeroWidth: 500,
      },
      {
        path: "/cadastro/confirmacao",
        heading: /Só falta\s*confirmar\s*seu e-mail\./,
        asset: "/auth/confirm-hero.webp",
        cardHeading: "Confira sua caixa de entrada",
        minHeroWidth: 520,
      },
      {
        path: "/reset-password?mode=request",
        heading: /Vamos ajudar\s*você a voltar\./,
        asset: "/auth/recovery-hero.webp",
        cardHeading: "E-mail cadastrado",
        minHeroWidth: 540,
      },
    ] as const;

    for (const current of cases) {
      await page.goto(current.path, { waitUntil: "domcontentloaded" });

      const main = page.locator("main#main-content");
      await expect(main).toBeVisible();
      const hero = main.locator(`img[src="${current.asset}"]`);
      await expect(hero).toBeVisible();
      await expect(page.getByRole("heading", { name: current.heading })).toBeVisible();
      await expect(page.getByRole("heading", { name: current.cardHeading, exact: true })).toBeVisible();

      const sections = main.locator(":scope > section");
      await expect(sections).toHaveCount(2);
      const leftBox = await sections.nth(0).boundingBox();
      const rightBox = await sections.nth(1).boundingBox();
      const heroBox = await hero.boundingBox();
      expect(leftBox).not.toBeNull();
      expect(rightBox).not.toBeNull();
      expect(heroBox).not.toBeNull();
      expect(leftBox!.x).toBeLessThan(rightBox!.x);
      expect(rightBox!.width).toBeGreaterThanOrEqual(390);
      expect(rightBox!.width).toBeLessThanOrEqual(450);
      expect(heroBox!.width).toBeGreaterThanOrEqual(current.minHeroWidth);
      expect(heroBox!.width).toBeLessThanOrEqual(570);
      expect(heroBox!.x + heroBox!.width).toBeLessThan(rightBox!.x);

      await expectNoHorizontalOverflow(page);
      await expectNoGenericSvgInMain(page);
    }

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Continuar com Google" }),
    ).toBeVisible();

    await page.goto("/aceitar-termos", { waitUntil: "domcontentloaded" });
    const termsMain = page.locator("main#main-content");
    await expect(termsMain).toBeVisible();
    await expect(termsMain.locator(":scope > section")).toHaveCount(2);
    await expect(
      page.getByRole("heading", {
        name: /Entre sabendo\s*como cuidamos\s*desse espaço\./,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Antes de continuar" }),
    ).toBeVisible();
    await expect(page.getByText("Conversas", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoGenericSvgInMain(page);
  });

  test("todas as superfícies públicas de conta não estouram o viewport nos principais limites", async ({ page }) => {
    const paths = [
      "/login",
      "/cadastro",
      "/cadastro/confirmacao",
      "/reset-password?mode=request",
      "/aceitar-termos",
    ] as const;

    for (const width of [320, 360, 390, 430, 767, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main#main-content")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectNoGenericSvgInMain(page);
      }
    }
  });
});
