import { expect, test, type Page } from "@playwright/test";

async function openCommunity(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
}

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

async function readRobots(page: Page) {
  return page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null);
}

test.describe("community social SEO policy", () => {
  test.setTimeout(180_000);

  test("feed route resolves as the social canonical surface", async ({ page }) => {
    await openCommunity(page, "/comunidade/ba/salvador/area/complexo-do-nordeste-de-amaralina/feed");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Feed|Comunidade|Complexo do Nordeste/i);

    expect((await readRobots(page)) ?? "index, follow").not.toMatch(/noindex/i);
  });

  test("groups route resolves as the social canonical surface", async ({ page }) => {
    await openCommunity(page, "/comunidade/ba/salvador/area/complexo-do-nordeste-de-amaralina/grupos");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Grupos|Comunidade|Complexo do Nordeste/i);

    expect((await readRobots(page)) ?? "index, follow").not.toMatch(/noindex/i);
  });
});
