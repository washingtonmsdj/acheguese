import { expect, test } from "@playwright/test";

test.describe("prelaunch landing", () => {
  test.setTimeout(60_000);

  test("introduces the community and links to the existing waitlist", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(
      "Achegue-se | Sua comunidade. Novas possibilidades.",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A força é daqui.O futuro é de todos.",
    );
    await page.getByRole("link", { name: "Quero fazer parte" }).first().click();
    await expect(page).toHaveURL(/#participar$/);
    await page.getByLabel("Nome", { exact: true }).fill("Ana E2E");
    await page.getByLabel("Email ou WhatsApp").fill("ana.e2e@example.com");
    await page.getByLabel("Bairro").selectOption("Santa Cruz");
    await page.getByLabel("Perfil").selectOption("morador");
    await expect(
      page.getByRole("button", { name: "Quero ser avisado" }),
    ).toBeEnabled();
    await expect(page.getByLabel("Bairro")).toHaveValue("Santa Cruz");
    await page
      .getByText("Vai chegar a outras cidades?", { exact: true })
      .click();
    await expect(
      page.getByText(/Ainda não há datas de lançamento/),
    ).toBeVisible();
  });

  test("keeps the home and registration readable on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const primaryLink = page
      .getByRole("link", { name: "Quero fazer parte" })
      .first();
    const primaryBox = await primaryLink.boundingBox();
    expect(primaryBox).not.toBeNull();
    if (primaryBox)
      expect(primaryBox.y + primaryBox.height).toBeLessThanOrEqual(844);
    await primaryLink.click();
    await expect(
      page.getByRole("form", { name: "Lista de espera" }),
    ).toBeVisible();
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  });
});
