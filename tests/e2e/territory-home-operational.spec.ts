import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "../../e2e/helpers/auth";
import { installTerritoryHomeFixtures } from "./support/territoryHomeFixtures";

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
      failedAppRequests.push(`${response.status()} ${url}`);
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

test.describe("Home territorial pública e determinística", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installTerritoryHomeFixtures(page);
  });

  test("visitante entra por / e explora um bairro sem cadastro", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/");
    await expect(
      page.getByRole("heading", {
        name: /Encontre o que importa perto de você/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    await page.getByRole("button", { name: "Pituba" }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);
    await expect(page.getByText("Hoje em Pituba")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Oficina Horizonte")).toBeVisible({
      timeout: 30_000,
    });
    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("Home de cidade preserva o panorama e sobrevive ao refresh", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador");
    await expect(
      page.getByRole("heading", { name: "Panorama de Salvador" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/visão ampla da cidade/i).first(),
    ).toBeVisible();
    await expect(page.getByText("Oficina Horizonte")).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(page).toHaveURL(/\/ba\/salvador$/);
    await expect(
      page.getByRole("heading", { name: "Panorama de Salvador" }),
    ).toBeVisible();
    health.assertHealthy();
  });

  test("território com pouca atividade mostra vazio útil e ampliação", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/valeria");
    await expect(
      page.getByRole("heading", { name: "Vale saber em Valéria" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("territory-home-empty")).toContainText(
      "pouca atividade recente",
    );
    await expect(
      page.getByRole("link", { name: /Ver Salvador inteira/i }),
    ).toHaveAttribute("href", "/ba/salvador");
    await expect(page.getByText("Oficina Horizonte")).toHaveCount(0);
    health.assertHealthy();
  });

  test("busca, navegação e troca territorial mantêm o contexto", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/pituba");
    await page.getByRole("link", { name: "Explorar", exact: true }).click();
    await expect(page).toHaveURL(/\/busca\/ba\/salvador\/pituba$/);
    await expect(
      page.getByRole("searchbox", { name: "Buscar em Pituba" }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: "Hoje", exact: true }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);
    await page.getByRole("link", { name: /Trocar território/i }).click();
    await expect(page).toHaveURL(/\/\?trocar=territorio$/);
    await page
      .getByRole("button", { name: /Explorar Salvador inteira/i })
      .click();
    await expect(page).toHaveURL(/\/ba\/salvador$/);
    health.assertHealthy();
  });

  test("deep-link do bairro abre diretamente e mantém a navegação primária", async ({
    page,
  }) => {
    await gotoApp(page, "/ba/salvador/pituba");
    await expect(page.getByText("Hoje em Pituba")).toBeVisible();
    await expect(
      page.getByText("Community ainda não liberada em Pituba."),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "Hoje", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    for (const label of ["Explorar", "Community", "Atividade", "Entrar"]) {
      await expect(
        page.locator(`[data-bottom-nav-item="${label.toLowerCase()}"]`),
      ).toBeVisible();
    }
  });

  test("shell adapta navegação, foco e movimento entre 320, tablet e desktop", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 844 });
    await gotoApp(page, "/ba/salvador/pituba");
    await expect(page.getByText("Hoje em Pituba")).toBeVisible({
      timeout: 30_000,
    });

    const mobileNav = page.locator('[data-territory-navigation="mobile"]');
    await expect(mobileNav).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const mobileTargets = await mobileNav.locator("a").evaluateAll((links) =>
      links.map((link) => {
        const bounds = link.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      }),
    );
    expect(
      mobileTargets.every(
        (target) => target.width >= 44 && target.height >= 44,
      ),
    ).toBe(true);

    const searchbox = page.getByRole("searchbox", { name: "Buscar em Pituba" });
    await searchbox.focus();
    const focusStyle = await searchbox.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        transitionSeconds: Math.max(
          ...style.transitionDuration
            .split(",")
            .map((duration) =>
              duration.trim().endsWith("ms")
                ? Number.parseFloat(duration) / 1000
                : Number.parseFloat(duration),
            ),
        ),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(focusStyle.transitionSeconds).toBeLessThanOrEqual(0.001);

    await page.setViewportSize({ width: 820, height: 1000 });
    await expect(
      page.locator('[data-territory-navigation="tablet"]'),
    ).toBeVisible();
    await expect(mobileNav).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(
      page.locator('[data-territory-navigation="desktop"]'),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", {
        name: "Contexto e serviços do território",
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Explorar", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Abrir mapa completo de Pituba" }),
    ).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Entrada territorial responsiva", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await installTerritoryHomeFixtures(page);
  });

  test("resolve busca pública e adapta o mapa de 320 a desktop", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);
    await page.setViewportSize({ width: 320, height: 844 });
    await gotoApp(page, "/?trocar=territorio");

    await expect(
      page.getByRole("heading", {
        name: "Salvador disponível por inteiro",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Usar minha localização" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("territory-entry-map-boundary-status"),
    ).toContainText("Limite oficial");
    await expect
      .poll(
        () =>
          page.evaluate(() => window.__mapState?.territoryPolygonCount ?? 0),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(() => window.__mapState?.zoom ?? 0), {
        timeout: 30_000,
      })
      .toBeGreaterThan(7);
    const cityZoom = await page.evaluate(() => window.__mapState?.zoom ?? 0);
    await expectNoHorizontalOverflow(page);

    const search = page.getByRole("combobox", {
      name: "Buscar cidade ou bairro",
    });
    await search.fill("Pitu");
    await expect(
      page.getByRole("option", { name: /Pituba, Salvador/ }),
    ).toBeVisible();
    await page.getByRole("option", { name: /Pituba, Salvador/ }).click();
    await expect(page).toHaveURL(/\/?\?trocar=territorio$/);
    await expect(
      page.getByRole("heading", { name: "Pituba em destaque" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Abrir mapa de Pituba" }),
    ).toHaveAttribute("href", "/mapa/ba/salvador/pituba");
    await expect
      .poll(() => page.evaluate(() => window.__mapState?.territoryBounds), {
        timeout: 30_000,
      })
      .toEqual({
        west: -38.47,
        south: -13.01,
        east: -38.44,
        north: -12.98,
      });
    await expect
      .poll(() => page.evaluate(() => window.__mapState?.zoom ?? 0), {
        timeout: 30_000,
      })
      .toBeGreaterThan(cityZoom + 2);
    await page.getByRole("button", { name: "Confirmar território" }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);

    await gotoApp(page, "/?trocar=territorio");
    await page.setViewportSize({ width: 820, height: 1000 });
    await expectNoHorizontalOverflow(page);
    await expect(
      page.getByText("Um ponto de partida para a vida local"),
    ).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expectNoHorizontalOverflow(page);
    const layout = await page
      .getByTestId("territory-entry-layout")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
    expect(layout.split(" ").length).toBeGreaterThanOrEqual(2);
    health.assertHealthy();
  });

  test("explica localização negada, território indisponível e retorno recente", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "achegue:last_territory",
        JSON.stringify({
          name: "Pituba",
          baseUrl: "/ba/salvador/pituba",
        }),
      );
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (
            _success: PositionCallback,
            error: PositionErrorCallback,
          ) => {
            const deniedError: GeolocationPositionError = {
              code: 1,
              message: "Permission denied",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            };
            error(deniedError);
          },
        },
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page, "/?trocar=territorio");

    await expect(page.getByText("Seu último território")).toBeVisible();
    await page.getByRole("button", { name: "Usar minha localização" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "A localização foi bloqueada",
    );

    const search = page.getByRole("combobox", {
      name: "Buscar cidade ou bairro",
    });
    await search.fill("Recife");
    await page.getByRole("button", { name: "Confirmar território" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "ainda não está disponível",
    );
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Home territorial autenticada", () => {
  test.describe.configure({ timeout: 120_000 });
  test.skip(
    !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
    "Fixture autenticada exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhum segredo padrão é inventado.",
  );

  test("fixture elegível abre a Home sem depender de sessão manual", async ({
    page,
  }) => {
    await loginAsUser(page);
    await gotoApp(page, "/ba/salvador/pituba");
    await expect(page.getByText("Hoje em Pituba")).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toHaveCount(0);
  });
});
