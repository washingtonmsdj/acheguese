import { expect, test, type Page } from "@playwright/test";

async function dismissConsentBanner(page: Page) {
  const labels = ["Aceitar Todos", "Aceitar todos", "Fechar"];
  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;
    await button.click({ timeout: 5_000 }).catch(() => {});
  }
}

test.describe("Eventos - Detalhe e Check-in", () => {
  test("bloqueia garantia de vaga sem login e mantém estado seguro", async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto(
      "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos",
      { waitUntil: "domcontentloaded" },
    );
    await dismissConsentBanner(page);

    let eventLinks = page.locator('a[href^="/eventos/"]').filter({
      hasNot: page.locator('[href="/eventos/favoritos"], [href="/eventos/calendario"], [href="/eventos/mapa"]'),
    });
    let linksCount = await eventLinks.count();

    if (linksCount === 0) {
      await page.goto("/eventos", { waitUntil: "domcontentloaded" });
      await dismissConsentBanner(page);
      eventLinks = page.locator('a[href^="/eventos/"]').filter({
        hasNot: page.locator(
          '[href="/eventos/favoritos"], [href="/eventos/calendario"], [href="/eventos/mapa"]',
        ),
      });
      linksCount = await eventLinks.count();
    }

    test.skip(
      linksCount === 0,
      "Sem eventos disponíveis para validar fluxo operacional (global e territorial).",
    );

    await eventLinks.first().click();
    await expect(page).toHaveURL(/\/eventos\/[^/]+$/);

    await expect(page.getByText("Check-in Digital")).toBeVisible();

    const ctaButton = page
      .getByRole("button", {
        name: /Inscrição gratuita|Garantir vaga|Ingresso reservado/i,
      })
      .first();

    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    await expect(page.getByText("Faça login para garantir vaga")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Cancelar inscrição|Cancelando/i }),
    ).toHaveCount(0);
  });
});
