import { expect, test, type Page } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  expectRouteReady,
  openPublicRoute,
} from "./support/publicRouteAssertions";

const MOBILE_VIEWPORT = { width: 360, height: 800 };

test.setTimeout(150_000);

async function expectMobileTerritorialSurface(page: Page, path: string, readyPattern: RegExp) {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await openPublicRoute(page, path, { timeoutMs: 90_000, waitUntil: "commit" });
  await expectRouteReady(page, { readyPattern });
  await expectNoHorizontalOverflow(page, MOBILE_VIEWPORT.width);
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

    await expectNoHorizontalOverflow(page, MOBILE_VIEWPORT.width);
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
