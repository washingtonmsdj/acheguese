import { expect, test } from "@playwright/test";
import { expectRouteReady, openPublicRoute, readBodyText, readTitle } from "./support/publicRouteAssertions";

test.describe("public landing routes", () => {
  test.setTimeout(120_000);

  test("home route renders the Complexo-first positioning", async ({ page }) => {
    await openPublicRoute(page, "/");
    await expectRouteReady(page, {
      readyPattern: /Achegue-se|Entrar no Meu Bairro|O Achegue-se começa pelo Complexo/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe("Achegue-se - Comunidade hiperlocal");
  });

  test("home community entry opens the launch community route", async ({ page }) => {
    test.setTimeout(60_000);
    await openPublicRoute(page, "/");
    await expectRouteReady(page, {
      readyPattern: /Achegue-se|Tudo do seu bairro|Comunidade/i,
    });

    const communityEntry = page
      .locator('a[href="/complexo-do-nordeste-de-amaralina"]')
      .first();
    await expect(communityEntry).toBeVisible({ timeout: 30_000 });
    await communityEntry.click();
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).not.toBe("/");

    const path = new URL(page.url()).pathname;
    const segments = path.split("/").filter(Boolean);
    expect(segments.length).toBeGreaterThanOrEqual(1);
    expect(path).toMatch(/^\/complexo-do-nordeste-de-amaralina/i);
  });

  test("canonical neighborhood community route remains a direct public entry", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/nordeste-de-amaralina");

    await expect.poll(() => page.url(), { timeout: 30_000 }).toContain("/comunidade/ba/salvador/nordeste-de-amaralina");
    await expectRouteReady(page, {
      readyPattern: /Nordeste de Amaralina|Meu bairro|Entrar no bairro/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toContain("Achegue-se");
  });

  test("businesses and services root routes expose branded SEO and main content", async ({ page }) => {
    await openPublicRoute(page, "/empresas");
    await expectRouteReady(page, {
      readyPattern: /Empresas|Cadastrar Empresa|Localiza/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe("Empresas locais | Achegue-se");

    await openPublicRoute(page, "/servicos");
    await expectRouteReady(page, {
      readyPattern: /Serviços|Servicos|Profissional|Eletricista/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe("Serviços locais | Achegue-se");
  });

  test("territorial business and services module routes use Salvador in SEO titles", async ({ page }) => {
    await openPublicRoute(page, "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina");
    await expectRouteReady(page, {
      readyPattern: /Complexo do Nordeste de Amaralina|Empresas/i,
    });
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe("Achegue-se Complexo do Nordeste de Amaralina | Empresas em Salvador");

    await openPublicRoute(page, "/servicos/ba/salvador/complexo-do-nordeste-de-amaralina");
    await expectRouteReady(page, {
      readyPattern: /Serviços|Servicos|Complexo do Nordeste de Amaralina|Profissional/i,
    });
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe("Achegue-se Complexo do Nordeste de Amaralina | Serviços em Salvador");
  });

  test("canonical territorial area routes render city, district, modules and community cockpit", async ({ page }) => {
    const routes = [
      { path: "/ba/salvador", text: /Salvador|Achegue-se/i },
      { path: "/ba/salvador/nordeste-de-amaralina", text: /Nordeste de Amaralina|Achegue-se/i },
      { path: "/ba/salvador/complexo-do-nordeste-de-amaralina", text: /Complexo do Nordeste de Amaralina|Empresas Locais/i },
      { path: "/empresas/ba/salvador", text: /Empresas|Salvador/i },
      { path: "/empresas/ba/salvador/nordeste-de-amaralina", text: /Empresas|Nordeste de Amaralina/i },
      { path: "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina", text: /Empresas|Complexo do Nordeste de Amaralina/i },
      { path: "/comunidade/ba/salvador/feed", text: /Feed|Comunidade|Salvador/i },
      { path: "/comunidade/ba/salvador/grupos", text: /Grupos|Comunidade|Salvador/i },
    ];

    for (const route of routes) {
      await openPublicRoute(page, route.path);
      await expectRouteReady(page, {
        readyPattern: route.text,
      });
      await expect
        .poll(async () => (await readBodyText(page)).includes("Local não encontrado"), {
          timeout: 15_000,
        })
        .toBe(false);
    }

    for (const path of [
      "/educacao/ba/salvador",
      "/educacao/ba/salvador/complexo-do-nordeste-de-amaralina",
    ]) {
      await openPublicRoute(page, path);
      await expect.poll(() => readBodyText(page), { timeout: 60_000 }).toMatch(/MVP publico|MVP público|separado para ajustes/i);
    }
  });
});
