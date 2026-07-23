import { expect, test } from "@playwright/test";

test.describe("prelaunch landing", () => {
  test.setTimeout(60_000);

  test("renders the live Salvador map and enables the waitlist form", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Achegue-se | Lista de espera");
    await expect(page.getByRole("heading", { name: "Seu bairro primeiro." })).toBeVisible();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".maplibregl-marker")).toHaveCount(5, { timeout: 30_000 });

    await page.getByLabel("Nome").fill("Ana E2E");
    await page.getByLabel("Email ou WhatsApp").fill("ana.e2e@example.com");
    await page.getByLabel("Bairro").selectOption("Complexo Nordeste de Amaralina");
    await page.getByLabel("Perfil").selectOption("morador");
    await page.waitForTimeout(1_250);

    await expect(page.getByRole("button", { name: "Quero ser avisado" })).toBeEnabled();
    await expect(page.getByLabel("Bairro")).toHaveValue("Complexo Nordeste de Amaralina");
    await expect(page.locator("main a")).toHaveCount(0);
  });

  test("keeps the landing readable without horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Seu bairro primeiro." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quero ser avisado" })).toBeVisible();

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  });
});
