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
      page.getByRole("heading", { name: "Tudo que importa, logo ali." }),
    ).toBeVisible({ timeout: 30_000 });

    const main = page.getByRole("main").first();

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

    await expect(
      main.getByRole("link", { name: /^Explorar empresas:/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: /^Abrir o mapa:/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: /^Ver perto de mim:/ }),
    ).toBeVisible();
    await expect(
      main.getByRole("link", { name: /^Buscar no território:/ }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Home territorial compõe somente o núcleo do MVP", async ({ page }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/pituba");

    await expect(
      page.getByRole("heading", { name: "Pituba", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const main = page.getByRole("main").first();
    const territorialShortcuts = page.getByLabel("Atalhos do território");
    await expect(
      territorialShortcuts.getByRole("link", { name: "Empresas", exact: true }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/empresas");
    await expect(
      territorialShortcuts.getByRole("link", { name: "Mapa", exact: true }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/mapa");
    await expect(
      territorialShortcuts.getByRole("link", { name: "Perto de mim", exact: true }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/perto-de-mim");
    await expect(
      territorialShortcuts.getByRole("link", { name: "Buscar", exact: true }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/busca");

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

    await gotoApp(page, "/ba/salvador/pituba/busca");

    await expect(
      page
        .getByRole("region", { name: "Busca", exact: true })
        .getByRole("heading", { name: "Busca", exact: true }),
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

    await gotoApp(page, "/ba/salvador/pituba/empresas");

    await expect(
      page
        .getByRole("region", { name: "Empresas", exact: true })
        .getByRole("heading", { name: "Empresas", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(HOME_BUSINESS.business_name).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1 empresas encontradas", exact: true }),
    ).toBeVisible();

    const mapLink = page.getByRole("link", { name: /Ver no mapa/i }).first();
    await expect(mapLink).toHaveAttribute("href", /\/mapa/);

    await expect(
      page
        .getByLabel("Atalhos do território")
        .getByRole("link", { name: "Perto de mim", exact: true }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/perto-de-mim");
    await expect(page.locator('a[href^="/recomendacoes"]')).toHaveCount(0);
    await expect(page.getByText("Indicar negocio", { exact: true })).toHaveCount(0);

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Mapa mantém somente Business como layer pública do MVP", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/pituba/mapa");

    await expect(page.locator('[data-page="mapa-v4"]')).toBeVisible({
      timeout: 30_000,
    });

    const relatedModules = page.getByLabel("Atalhos do território");
    await expect(
      relatedModules.getByRole("link", { name: "Empresas" }),
    ).toBeVisible();
    await expect(
      relatedModules.getByRole("link", { name: "Perto de mim" }),
    ).toHaveAttribute("href", "/ba/salvador/pituba/perto-de-mim");

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

    await gotoApp(page, "/ba/salvador/pituba/perto-de-mim");

    const gpsButton = page.getByRole("button", { name: "Usar GPS", exact: true });
    await expect(gpsButton).toBeVisible({ timeout: 30_000 });
    await gpsButton.click();

    await expect(page.getByText(HOME_BUSINESS.business_name).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", {
        name: `${HOME_BUSINESS.business_name} 430 m`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Mais próximos de você",
        exact: true,
      }),
    ).toBeVisible();

    const openMapButton = page.getByRole("button", {
      name: "Abrir mapa completo",
      exact: true,
    });
    await expect(openMapButton).toBeVisible();
    await expect(
      page.getByText("Buscando perto de:", { exact: true }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
    health.assertHealthy();

    await openMapButton.click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba\/mapa$/);
  });
});
