import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/axeAssertions";
import { expectMobilePublicSurface } from "./support/publicRouteAssertions";

const MOBILE_PUBLIC_ROUTES = [
  {
    path: "/",
    readyPattern:
      /Achegue-se|Entrar no Meu Bairro|O Achegue-se começa pelo Complexo/i,
  },
  {
    path: "/login",
    readyPattern: /Bem-vindo de volta|Entrar/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/cadastro",
    readyPattern: /Achegue-se|Crie sua conta/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/sobre",
    readyPattern: /Sobre o Achegue-se/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/contato",
    readyPattern: /Entre em Contato|Achegue-se/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/servicos/ba/salvador/complexo-do-nordeste-de-amaralina",
    readyPattern:
      /Serviços|Servicos|Complexo do Nordeste de Amaralina|Profissional/i,
  },
  {
    path: "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina/tone-cos-loja",
    readyPattern: /Tone|Empresa|Comercio|Comércio|Detalhes/i,
  },
  {
    path: "/comunidade/ba/salvador/feed",
    readyPattern: /Feed|Comunidade|Salvador/i,
  },
  {
    path: "/gastronomia/ba/salvador",
    readyPattern: /Gastronomia|Restaurantes|Cardapio|Cardápio|Pizza|Açaí|Acai/i,
  },
  {
    path: "/termos",
    readyPattern: /Termos de uso|Regras contratuais para uso do Achegue-se/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/privacidade",
    readyPattern:
      /Política de privacidade|Como o Achegue-se trata dados pessoais/i,
    mainSelector: "main#main-content",
  },
  {
    path: "/dpo",
    readyPattern:
      /Contato com o encarregado de dados|Solicite acesso, correção, exclusão ou reporte uma violação/i,
    mainSelector: "main#main-content",
  },
] as const;

const TABLET_PUBLIC_ROUTES = [
  MOBILE_PUBLIC_ROUTES[0],
  MOBILE_PUBLIC_ROUTES[5],
  MOBILE_PUBLIC_ROUTES[8],
] as const;

test.setTimeout(120_000);

test.describe("Mobile core public layout", () => {
  test("header e bottom nav publicos seguem o contrato mobile em 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");

    const header = page.locator(".home-header");
    const menuTrigger = page.getByRole("button", {
      name: "Abrir menu principal",
    });
    const bottomNav = page.getByRole("navigation", {
      name: "Navegacao principal mobile",
    });

    await expect(header).toBeVisible({ timeout: 45_000 });
    await expect(menuTrigger).toBeVisible();
    await expect(page.locator(".home-nav")).toBeHidden();
    await expect(bottomNav).toBeVisible();
    await expect(header).not.toContainText(/\d{1,2}\s*°C/);

    const layout = await page.evaluate(() => {
      const brandText = document.querySelector(".home-brand > span:last-child");
      const headerElement = document.querySelector(".home-header");
      const bottomLabel = document.querySelector(
        'nav[aria-label="Navegacao principal mobile"] button span:last-child',
      );

      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        brandWhiteSpace: brandText
          ? getComputedStyle(brandText).whiteSpace
          : null,
        brandFont: brandText ? getComputedStyle(brandText).fontFamily : null,
        headerFont: headerElement
          ? getComputedStyle(headerElement).fontFamily
          : null,
        bottomFont: bottomLabel
          ? getComputedStyle(bottomLabel).fontFamily
          : null,
      };
    });

    expect(layout.overflow).toBe(0);
    expect(layout.brandWhiteSpace).toBe("nowrap");
    expect(layout.brandFont).toContain("Space Grotesk");
    expect(layout.headerFont).toContain("DM Sans");
    expect(layout.bottomFont).toContain("DM Sans");

    await menuTrigger.click();
    const mobileMenu = page.getByRole("navigation", {
      name: "Menu principal mobile",
    });
    await expect(mobileMenu).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Comunidades" }),
    ).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Empresas" }),
    ).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Gastronomia" }),
    ).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Serviços" }),
    ).toBeVisible();
    await expect(
      mobileMenu.getByRole("link", { name: "Classificados" }),
    ).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Mapa" })).toBeVisible();
    await expect(mobileMenu.getByRole("link", { name: "Busca" })).toBeVisible();
    await expect(
      mobileMenu.locator("[data-public-header-nav-item]"),
    ).toHaveCount(8);
    await expect(mobileMenu.getByRole("link", { name: "Eventos" })).toHaveCount(
      0,
    );
  });

  for (const route of MOBILE_PUBLIC_ROUTES) {
    test(`${route.path} em 360px`, async ({ page }) => {
      await expectMobilePublicSurface(page, {
        path: route.path,
        expectedUrlPart: route.path,
        readyPattern: route.readyPattern,
        mainSelector: route.mainSelector,
      });
    });
  }

  for (const route of TABLET_PUBLIC_ROUTES) {
    test(`${route.path} em 768px`, async ({ page }) => {
      await expectMobilePublicSurface(page, {
        path: route.path,
        expectedUrlPart: route.path,
        readyPattern: route.readyPattern,
        mainSelector: route.mainSelector,
        viewport: { width: 768, height: 1024 },
      });
    });
  }

  test("/gastronomia/ba/salvador nao tem violacoes axe serias em 360px", async ({
    page,
  }) => {
    await expectMobilePublicSurface(page, {
      path: "/gastronomia/ba/salvador",
      expectedUrlPart: "/gastronomia/ba/salvador",
      readyPattern:
        /Gastronomia|Restaurantes|Cardapio|CardÃ¡pio|Pizza|AÃ§aÃ­|Acai/i,
    });

    await expectNoSeriousA11yViolations(page);
  });
});
