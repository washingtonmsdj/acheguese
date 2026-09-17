import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
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

  test("visitante entra pela raiz enxuta e encontra a comunidade de lançamento sem cadastro", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/");
    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible({ timeout: 30_000 });

    const communityPreview = page.locator(".entry-community-preview");
    const deferredDesktopImage = communityPreview.locator(":scope > div");
    await expect(deferredDesktopImage).toBeHidden();
    await expect(communityPreview.locator("img")).toBeHidden();

    const exploreCommunity = page.getByRole("link", {
      name: "Explorar o Complexo",
    });
    await expect(exploreCommunity).toHaveAttribute(
      "href",
      "/comunidade/complexo-do-nordeste-de-amaralina",
    );
    await expect(page.getByText("Sem cadastro para explorar.")).toBeVisible();

    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 820, height: 1000 });
    await expect(deferredDesktopImage).toBeVisible();
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
      page.locator('main[data-responsive-page-frame="wide"]'),
    ).toBeVisible();
    await expect(
      page.getByText(/Uma leitura ampla do que está válido nos territórios da cidade/i),
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
      page.getByRole("heading", { name: "Na sua comunidade" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("territory-home-empty")).toContainText(
      "pouca atividade recente",
    );
    await expect(
      page
        .getByTestId("territory-home-empty")
        .getByRole("link", { name: /Ver Salvador inteira/i }),
    ).toHaveAttribute("href", "/ba/salvador");
    await expect(page.getByText("Oficina Horizonte")).toHaveCount(0);
    health.assertHealthy();
  });

  test("busca, navegação e troca territorial mantêm o contexto", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);

    await gotoApp(page, "/ba/salvador/pituba");
    await page
      .getByRole("searchbox", { name: "O que você procura por aqui?" })
      .press("Enter");
    await expect(page).toHaveURL(/\/busca\/ba\/salvador\/pituba$/);
    await expect(
      page.getByRole("heading", { name: "Explorar", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: "Hoje", exact: true }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);
    await page.getByRole("link", { name: /Trocar território/i }).click();
    await expect(page).toHaveURL(/\/\?trocar=territorio$/);
    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", {
        name: "Explorar o Complexo",
      }),
    ).toBeVisible();
    health.assertHealthy();
  });

  test("deep-link do bairro abre diretamente e mantém a navegação primária", async ({
    page,
  }) => {
    await gotoApp(page, "/ba/salvador/pituba");
    await expect(
      page.getByRole("heading", { name: "Na sua comunidade" }),
    ).toBeVisible();
    await expect(
      page.getByText("Ainda há pouca atividade recente registrada por aqui."),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "Hoje", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    for (const label of [
      "Hoje",
      "Explorar",
      "Comunidade",
      "Atividade",
      "Entrar",
    ]) {
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
    await expect(
      page.getByRole("heading", { name: "Na sua comunidade" }),
    ).toBeVisible({
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

    const searchbox = page.getByRole("searchbox", {
      name: "O que você procura por aqui?",
    });
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

    await page
      .locator('[data-territory-navigation="desktop"]')
      .getByRole("link", { name: "Explorar", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Explorar", exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Entrada pública de lançamento responsiva", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await installTerritoryHomeFixtures(page);
  });

  test("/?trocar=territorio preserva a entrada community-first de 320 a desktop", async ({
    page,
  }) => {
    const health = observeBrowserHealth(page);
    await page.setViewportSize({ width: 320, height: 844 });
    await gotoApp(page, "/?trocar=territorio");

    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", {
        name: "Explorar o Complexo",
      }),
    ).toHaveAttribute(
      "href",
      "/comunidade/complexo-do-nordeste-de-amaralina",
    );
    await expect(
      page.getByRole("combobox", { name: "Buscar cidade ou bairro" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Usar minha localização" }),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    const communityPreview = page.locator(".entry-community-preview");
    const deferredDesktopImage = communityPreview.locator(":scope > div");
    await expect(deferredDesktopImage).toBeHidden();

    await page.setViewportSize({ width: 820, height: 1000 });
    await expect(deferredDesktopImage).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expect(
      page.getByText("Sem cadastro para explorar."),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    health.assertHealthy();
  });

  test("território salvo e geolocalização não desviam a raiz de lançamento", async ({
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
          getCurrentPosition: () => {
            throw new Error("A raiz de lançamento não deve consultar geolocalização");
          },
        },
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page, "/?trocar=territorio");

    await expect(
      page.getByRole("heading", { name: "Seu lugar, mais perto." }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Seu último território")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Usar minha localização" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", {
        name: "Explorar o Complexo",
      }),
    ).toBeVisible();
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
    await expect(
      page.getByRole("heading", { name: "Seu bairro, mais perto." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toHaveCount(0);
  });
});
