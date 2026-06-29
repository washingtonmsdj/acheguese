import { expect, test, type Page } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 360, height: 800 };
const NAVIGATION_TIMEOUT_MS = 90_000;
const CONTENT_TIMEOUT_MS = 120_000;
const LOADER_PATTERNS = [/Preparando a casa/i, /Buscando as informa(?:ç|c)ões/i];

test.setTimeout(150_000);

async function openMobileRoute(page: Page, path: string) {
  await page.setViewportSize(MOBILE_VIEWPORT);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "commit", timeout: NAVIGATION_TIMEOUT_MS });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1_500);
    }
  }
}

async function readBodyText(page: Page) {
  return page.locator("body").innerText().catch(() => "");
}

function hasBlockingLoader(text: string) {
  return LOADER_PATTERNS.some((pattern) => pattern.test(text));
}

async function expectMainContent(page: Page, readyPattern: RegExp) {
  await expect
    .poll(
      async () => {
        const mainVisible = await page.locator("main").first().isVisible().catch(() => false);
        const bodyText = await readBodyText(page);
        const hasContent = readyPattern.test(bodyText);
        return mainVisible && hasContent && !hasBlockingLoader(bodyText);
      },
      { timeout: CONTENT_TIMEOUT_MS },
    )
    .toBe(true);
}

async function expectNoHorizontalOverflow(page: Page) {
  const viewport = page.viewportSize();
  const maxAllowed = (viewport?.width ?? MOBILE_VIEWPORT.width) + 2;

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const html = document.documentElement;
          const body = document.body;
          return Math.max(html?.scrollWidth ?? 0, body?.scrollWidth ?? 0);
        }),
      { timeout: 20_000 },
    )
    .toBeLessThanOrEqual(maxAllowed);
}

async function expectMobileTerritorialSurface(page: Page, path: string, readyPattern: RegExp) {
  await openMobileRoute(page, path);
  await expectMainContent(page, readyPattern);
  await expectNoHorizontalOverflow(page);
}

test.describe("Mobile territorial public surfaces", () => {
  test("cidade /ba/salvador em 360px", async ({ page }) => {
    await expectMobileTerritorialSurface(page, "/ba/salvador", /salvador em tempo real/i);
    await expect(page.getByRole("heading", { name: /salvador em tempo real/i })).toBeVisible();
    await expect(page.getByLabel(/mapa territorial de salvador/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /bairros/i }).first()).toBeVisible();
  });

  test("comunidade de bairro em 360px", async ({ page }) => {
    await expectMobileTerritorialSurface(
      page,
      "/comunidade/ba/salvador/nordeste-de-amaralina",
      /nordeste de amaralina/i,
    );
    await expect(page.getByText(/nordeste de amaralina/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /meu bairro/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^tudo$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /entrar no bairro/i }).first()).toBeVisible();
  });

  test("abas do stream do bairro trocam contexto sem redirecionar", async ({ page }) => {
    await expectMobileTerritorialSurface(
      page,
      "/comunidade/ba/salvador/nordeste-de-amaralina",
      /nordeste de amaralina/i,
    );

    const initialPath = new URL(page.url()).pathname;
    const feedTab = page.getByRole("tab", { name: /^feed$/i });
    const businessTab = page.getByRole("tab", { name: /^emp\.$/i });
    const servicesTab = page.getByRole("tab", { name: /^serv\.$/i });

    await feedTab.click();
    await expect(feedTab).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => new URL(page.url()).pathname).toBe(initialPath);

    await businessTab.click();
    await expect(businessTab).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => new URL(page.url()).pathname).toBe(initialPath);

    await servicesTab.click();
    await expect(servicesTab).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => new URL(page.url()).pathname).toBe(initialPath);

    await expectNoHorizontalOverflow(page);
  });

  test("cta de ver mais do bairro aponta para módulo canônico", async ({ page }) => {
    await expectMobileTerritorialSurface(
      page,
      "/comunidade/ba/salvador/nordeste-de-amaralina",
      /nordeste de amaralina/i,
    );

    const moreLink = page.locator("a.neighborhood-community-more").first();
    await expect(moreLink).toBeVisible();
    await expect(moreLink).toHaveAttribute("href", /\/comunidade\/ba\/salvador\/nordeste-de-amaralina\/feed/i);
  });
});
