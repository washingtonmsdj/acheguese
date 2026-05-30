import { expect, test, type Page } from "@playwright/test";

async function openRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
}

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

async function readRobots(page: Page) {
  return page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
}

async function readCanonical(page: Page) {
  return page.locator('link[rel="canonical"]').first().getAttribute("href").catch(() => null);
}

test.describe("territorial SEO policy", () => {
  test.setTimeout(180_000);

  test("public territorial pages render indexable content", async ({ page }) => {
    await openRoute(page, "/ba/salvador/complexo-do-nordeste-de-amaralina");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Complexo do Nordeste de Amaralina|Achegue-se|Empresas Locais/i);

    const robots = await readRobots(page);
    expect(robots ?? "index, follow").not.toMatch(/noindex/i);
  });

  test("duplicated module inside community keeps noindex policy", async ({ page }) => {
    await openRoute(page, "/comunidade/ba/salvador/classificados");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Classificados|Comunidade|Salvador/i);

    await expect.poll(() => readRobots(page), { timeout: 60_000 }).toMatch(/noindex/i);

    const canonical = await readCanonical(page);
    expect(canonical ?? "").toContain("/classificados/ba/salvador");
  });
});
