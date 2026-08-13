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
      page.getByRole("heading", { name: /Tudo começa pelo seu bairro/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    await page.getByRole("button", { name: "Pituba" }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);
    await expect(page.getByText("Hoje em Pituba")).toBeVisible();
    await expect(page.getByText("Oficina Horizonte")).toBeVisible();
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
    ).toBeVisible();
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
    await expect(page.getByLabel("Campo de busca")).toBeVisible();

    await page.getByRole("link", { name: "Hoje", exact: true }).click();
    await expect(page).toHaveURL(/\/ba\/salvador\/pituba$/);
    await page.getByRole("link", { name: /Trocar território/i }).click();
    await expect(page).toHaveURL(/\/\?trocar=territorio$/);
    await page.getByRole("button", { name: /Ver Salvador inteira/i }).click();
    await expect(page).toHaveURL(/\/ba\/salvador$/);
    health.assertHealthy();
  });

  test("deep-link do bairro abre diretamente e mantém a navegação primária", async ({
    page,
  }) => {
    await gotoApp(page, "/ba/salvador/pituba");
    await expect(page.getByText("Hoje em Pituba")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Hoje", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    for (const label of ["Explorar", "Community", "Atividade", "Entrar"]) {
      await expect(
        page.locator(`[data-bottom-nav-item="${label.toLowerCase()}"]`),
      ).toBeVisible();
    }
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
