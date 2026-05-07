import { expect, test, type Page } from "@playwright/test";

async function openSpaRoute(page: Page, path: string) {
  await page.goto(path, {
    timeout: 15_000,
    waitUntil: "commit",
  });
}

async function readBodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

async function hasMainLandmark(page: Page) {
  return page.evaluate(() => Boolean(document.querySelector("main"))).catch(() => false);
}

test.describe("professional operational routes", () => {
  test.setTimeout(150_000);

  test("tracking route does not stay stuck on the global suspense loader", async ({ page }) => {
    await openSpaRoute(page, "/servicos");
    await expect
      .poll(() => hasMainLandmark(page), { timeout: 90_000 })
      .toBe(true);

    await openSpaRoute(page, "/servicos/orcamentos/fake-lead-id");

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Acompanhar or[çc]amento|Or[çc]amento n[aã]o encontrado/i);

    await expect
      .poll(() => hasMainLandmark(page), { timeout: 5_000 })
      .toBe(true);
    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa para você se achegar"), {
        timeout: 30_000,
      })
      .toBe(false);
  });

  test("services landing route resolves beyond the global suspense loader", async ({ page }) => {
    await openSpaRoute(page, "/servicos");

    await expect
      .poll(() => hasMainLandmark(page), { timeout: 60_000 })
      .toBe(true);

    await expect
      .poll(async () => (await readBodyText(page)).includes("Preparando a casa para você se achegar"), {
        timeout: 30_000,
      })
      .toBe(false);
  });
});
