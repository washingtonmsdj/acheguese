import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  HOME_BUSINESS,
  installTerritoryHomeFixtures,
} from "./support/territoryHomeFixtures";

interface BrowserHealthProbe {
  assertHealthy(): void;
}

function observeBrowserHealth(page: Page): BrowserHealthProbe {
  const pageErrors: string[] = [];
  const failedAppRequests: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    const isRelevant =
      url.startsWith("http://127.0.0.1") ||
      url.includes("/rest/v1/") ||
      url.includes("/auth/v1/");

    if (isRelevant && response.status() >= 400) {
      failedAppRequests.push(String(response.status()) + " " + url);
    }
  });

  return {
    assertHealthy() {
      expect(pageErrors, "erros não tratados no navegador").toEqual([]);
      expect(failedAppRequests, "requests críticos com falha").toEqual([]);
    },
  };
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

async function gotoApp(page: Page, path: string): Promise<void> {
  await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
}

async function enablePreciseGeolocation(
  context: BrowserContext,
): Promise<void> {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: -13.0001,
    longitude: -38.4601,
    accuracy: 15,
  });
}

test.describe("MVP público — Empresas + Mapa + Perto de mim + Busca", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installTerritoryHomeFixtures(page);
  });

  test("raiz apresenta somente o núcleo público ativo", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/");

    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible({ timeout: 30_000 });

    const main = page.locator("#main-content");

    for (const pausedLabel of [
      "Comunidade",
      "Classificados",
      "Serviços",
      "Gastronomia",
      "Eventos",
      "Vagas",
      "Educação",
    ]) {
      await expect(main.getByText(pausedLabel, { exact: true })).toHaveCount(0);
    }

    await expect(main.locator('a[href^="/empresas/"]').first()).toBeVisible();
    await expect(main.locator('a[href^="/mapa/"]').first()).toBeVisible();
    await expect(main.locator('a[href="/perto-de-mim"]').first()).toBeVisible();
    await expect(main.locator('a[href^="/busca/"]').first()).toBeVisible();

    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Home territorial compõe somente o núcleo do MVP", async ({ page }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/pituba");

    await expect(
      page.getByRole("heading", {
        name: "Descubra empresas e lugares ao seu redor.",
      }),
    ).toBeVisible({ timeout: 30_000 });

    const main = page.locator("main");
    await expect(
      main.locator('a[href="/empresas/ba/salvador/pituba"]'),
    ).toBeVisible();
    await expect(
      main.locator('a[href="/mapa/ba/salvador/pituba"]'),
    ).toBeVisible();
    await expect(
      main.locator('a[href="/perto-de-mim/ba/salvador/pituba"]'),
    ).toBeVisible();
    await expect(
      main.locator('a[href="/busca/ba/salvador/pituba"]'),
    ).toBeVisible();

    for (const staleSurface of [
      "/comunidade",
      "/classificados",
      "/servicos",
      "/eventos",
      "/vagas",
    ]) {
      await expect(main.locator('a[href^="' + staleSurface + '"]')).toHaveCount(
        0,
      );
    }

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Busca fica ativa e não expõe categorias pausadas", async ({ page }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/busca/ba/salvador/pituba");

    await expect(
      page.getByRole("heading", { name: "Busca", exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Negócios", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "restaurantes", exact: true }),
    ).toBeVisible();

    for (const paused of ["Comunidades", "Serviços", "Classificados", "Eventos", "Oportunidades", "Posts"]) {
      await expect(page.getByText(paused, { exact: true })).toHaveCount(0);
    }

    for (const pausedSuggestion of [
      "comunidade pituba",
      "pedreiro pituba",
      "bicicleta usada",
      "eventos hoje",
      "vagas perto de mim",
    ]) {
      await expect(
        page.getByRole("button", { name: pausedSuggestion, exact: true }),
      ).toHaveCount(0);
    }

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Empresas usa dados públicos reais do fixture e integra com o Mapa", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/empresas/ba/salvador/pituba");

    await expect(
      page.getByRole("heading", { name: "Empresas do bairro" }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(HOME_BUSINESS.business_name).first()).toBeVisible();
    await expect(page.getByText("Todas as empresas (1)")).toBeVisible();

    const mapLink = page.getByRole("link", { name: /Ver no mapa/i }).first();
    await expect(mapLink).toHaveAttribute("href", /\/mapa/);

    await expect(
      page.locator('a[href="/perto-de-mim/ba/salvador/pituba"]').first(),
    ).toBeVisible();
    await expect(page.locator('a[href^="/recomendacoes"]')).toHaveCount(0);
    await expect(page.getByText("Indicar negocio", { exact: true })).toHaveCount(0);

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Mapa mantém somente Business como layer pública do MVP", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/mapa/ba/salvador/pituba");

    await expect(page.locator('[data-page="mapa-v4"]')).toBeVisible({
      timeout: 30_000,
    });

    const relatedModules = page.getByRole("navigation", {
      name: "Módulos relacionados ao mapa",
    });
    await expect(
      relatedModules.getByRole("link", { name: "Empresas" }),
    ).toBeVisible();
    await expect(
      relatedModules.getByRole("link", { name: "Perto de mim" }),
    ).toHaveAttribute("href", "/perto-de-mim/ba/salvador/pituba");

    for (const paused of ["Gastronomia", "Serviços", "Classificados", "Eventos"]) {
      await expect(relatedModules.getByText(paused, { exact: true })).toHaveCount(
        0,
      );
    }

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Perto de mim usa GPS real e resolve Business sem inventar distância", async ({
    context,
    page,
  }) => {
    await enablePreciseGeolocation(context);
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/perto-de-mim/ba/salvador/pituba");

    await expect(page.getByText(HOME_BUSINESS.business_name).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("430m")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Empresas perto de você",
        exact: true,
      }),
    ).toBeVisible();

    const openMapButton = page.getByRole("button", { name: "Abrir mapa" });
    await expect(openMapButton).toBeVisible();
    await expect(
      page.getByText("Empresas próximas com localização real"),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();

    await openMapButton.click();
    await expect(page).toHaveURL(/\/mapa\/ba\/salvador\/pituba$/);
  });
});
