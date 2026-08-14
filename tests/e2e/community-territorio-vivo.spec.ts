import { expect, test, type Page } from "@playwright/test";
import {
  expectRouteReady,
  openPublicRoute,
} from "./support/publicRouteAssertions";

const ROUTES = {
  active: "/comunidade/ba/salvador/nordeste-de-amaralina",
  activeClusterMember: "/comunidade/ba/salvador/santa-cruz",
  comingSoon: "/comunidade/ba/salvador/pituba",
  unavailable: "/comunidade/ba/salvador/valeria",
  city: "/comunidade/ba/salvador",
} as const;

async function expectCommunityState(
  page: Page,
  route: string,
  state: "active" | "coming_soon" | "unavailable",
) {
  await openPublicRoute(page, route, {
    waitUntil: "domcontentloaded",
    dismissConsent: true,
  });
  await expectRouteReady(page, {
    expectedUrlPart: "/comunidade/",
    readyPattern: /Community|Comunidade|Complexo|Pituba|Valéria|Salvador/i,
  });
  await expect(
    page.locator(`[data-community-state="${state}"]`).first(),
  ).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Community Território Vivo", () => {
  test.setTimeout(240_000);

  test("opens the official active cluster from two member territories", async ({
    page,
  }) => {
    await expectCommunityState(page, ROUTES.active, "active");
    await expect(
      page.getByRole("heading", { name: /Complexo/i }).first(),
    ).toBeVisible();
    await expect(page.locator('[data-community-composer="entry"]')).toHaveCount(
      0,
    );

    await expectCommunityState(page, ROUTES.activeClusterMember, "active");
    await expect(
      page.getByRole("heading", { name: /Complexo/i }).first(),
    ).toBeVisible();
  });

  test("keeps Pituba in the persisted coming-soon contract", async ({
    page,
  }) => {
    await expectCommunityState(page, ROUTES.comingSoon, "coming_soon");
    await expect(
      page.getByRole("link", { name: "Quero ser avisado" }),
    ).toHaveAttribute("href", /\/interesse$/);
    await expect(
      page.locator('[data-community-overview="community-first"]'),
    ).toHaveCount(0);
  });

  test("does not manufacture Community identities for Valéria or city scope", async ({
    page,
  }) => {
    await expectCommunityState(page, ROUTES.unavailable, "unavailable");
    await expect(
      page.getByRole("link", { name: "Quero ser avisado" }),
    ).toHaveCount(0);

    await expectCommunityState(page, ROUTES.city, "unavailable");
    await expect(
      page.locator('[data-community-overview="community-first"]'),
    ).toHaveCount(0);
  });

  test("preserves feed query params across refresh, history and deep links", async ({
    page,
  }) => {
    const deepLink = `${ROUTES.active}/feed?tab=alertas&post=post-inexistente`;
    await openPublicRoute(page, deepLink, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });
    await expect(
      page.locator('[data-community-state="active"]').first(),
    ).toBeVisible({
      timeout: 30_000,
    });
    expect(page.url()).toContain("tab=alertas");
    expect(page.url()).toContain("post=post-inexistente");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.locator('[data-community-state="active"]').first(),
    ).toBeVisible({
      timeout: 30_000,
    });
    expect(page.url()).toContain("tab=alertas");
    expect(page.url()).toContain("post=post-inexistente");

    await page.goto(ROUTES.comingSoon, { waitUntil: "domcontentloaded" });
    await page.goBack({ waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("tab=alertas");
    expect(page.url()).toContain("post=post-inexistente");
  });

  test("uses the adaptive navigation at mobile, tablet and desktop widths", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 390, height: 844, mode: "mobile" },
      { width: 820, height: 1000, mode: "tablet" },
      { width: 1440, height: 1000, mode: "desktop" },
    ] as const) {
      await page.setViewportSize(viewport);
      await expectCommunityState(page, ROUTES.active, "active");
      await expect(
        page.locator(`[data-territory-navigation="${viewport.mode}"]`),
      ).toBeVisible();
      await expect(
        page
          .locator(
            `[data-territory-navigation="${viewport.mode}"] a[aria-current="page"]`,
          )
          .filter({ hasText: "Community" }),
      ).toHaveAttribute("aria-current", "page");
    }
  });
});
