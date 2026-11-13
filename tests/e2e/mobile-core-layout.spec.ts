import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./support/axeAssertions";
import {
  expectMobilePublicSurface,
  expectNotFoundPublicRoute,
} from "./support/publicRouteAssertions";
import {
  E2E_BUSINESS,
  installBusinessRouteFixtures,
} from "./support/businessRouteFixtures";

const MOBILE_PUBLIC_ROUTES = [
  {
    path: "/",
    readyPattern: /Tudo que importa|Empresas, mapa, busca|Achegue-se/i,
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
    path: E2E_BUSINESS.publicPath,
    readyPattern: /Oficina Horizonte E2E|Empresa|Comercio|Comércio|Detalhes/i,
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
  MOBILE_PUBLIC_ROUTES[1],
  MOBILE_PUBLIC_ROUTES[3],
] as const;

const PAUSED_PRODUCT_ROUTES = [
  "/servicos/ba/salvador/complexo-do-nordeste-de-amaralina",
  "/comunidade/ba/salvador/feed",
  "/gastronomia/ba/salvador",
  "/classificados/ba/salvador",
] as const;

test.setTimeout(120_000);

test.describe("Mobile core public layout", () => {
  test("raiz em 320px expõe apenas os caminhos ativos do MVP", async ({
    page,
  }) => {
    await expectMobilePublicSurface(page, {
      path: "/",
      readyPattern: /Tudo que importa|Empresas, mapa, busca|Achegue-se/i,
      viewport: { width: 320, height: 800 },
    });

    const header = page.locator(".ag-header");
    const brand = page.locator(".ag-brand").first();

    await expect(header).toBeVisible();
    await expect(brand).toBeVisible();
    await expect(page.locator(".ag-nav")).toBeHidden();
    await expect(page.locator(".ag-account-link")).toBeVisible();
    await expect(page.locator(".ag-module-card")).toHaveCount(4);

    await expect(
      page.getByRole("link", { name: /Explorar empresas:/i }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /Abrir o mapa:/i }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /Ver perto de mim:/i }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /Buscar no território:/i }),
    ).toHaveCount(1);

    for (const pausedLabel of [
      "Comunidades",
      "Gastronomia",
      "Serviços",
      "Classificados",
      "Eventos",
    ]) {
      await expect(
        page.getByRole("link", { name: pausedLabel, exact: true }),
      ).toHaveCount(0);
    }

    const layout = await page.evaluate(() => {
      const brandText = document.querySelector(".ag-brand > span");
      const headerElement = document.querySelector(".ag-header");

      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        brandWhiteSpace: brandText
          ? getComputedStyle(brandText).whiteSpace
          : null,
        brandFont: brandText ? getComputedStyle(brandText).fontFamily : null,
        headerFont: headerElement
          ? getComputedStyle(headerElement).fontFamily
          : null,
      };
    });

    expect(layout.overflow).toBe(0);
    expect(layout.brandWhiteSpace).toBe("nowrap");
    expect(layout.brandFont).toContain("Plus Jakarta Sans");
    expect(layout.headerFont).toContain("Plus Jakarta Sans");
  });

  for (const route of MOBILE_PUBLIC_ROUTES) {
    test(`${route.path} em 360px`, async ({ page }) => {
      if (route.path === E2E_BUSINESS.publicPath) {
        await installBusinessRouteFixtures(page);
      }
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

  test("domínios pausados permanecem fora do grafo público mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    for (const path of PAUSED_PRODUCT_ROUTES) {
      await expectNotFoundPublicRoute(page, path);
    }
  });

  test("raiz ativa não tem violações axe sérias em 360px", async ({ page }) => {
    await expectMobilePublicSurface(page, {
      path: "/",
      readyPattern: /Tudo que importa|Empresas, mapa, busca|Achegue-se/i,
    });

    await expectNoSeriousA11yViolations(page);
  });
});
