import { expect, test } from "@playwright/test";
import { expectRouteReady, openPublicRoute } from "./support/publicRouteAssertions";

test.describe("community territorial routes", () => {
  test.setTimeout(240_000);

  test("city-level community route resolves", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Comunidade|Feed|Salvador/i,
    });
  });

  test("city feed and groups resolve", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/feed", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    await openPublicRoute(page, "/comunidade/ba/salvador/grupos", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Grupos|Comunidade|Salvador/i,
    });
  });

  test("city social surfaces stay canonical", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/feed", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    await openPublicRoute(page, "/comunidade/ba/salvador/grupos", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Grupos|Comunidade|Salvador/i,
    });
  });

  test("community sidebar hides paused education surface", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/feed", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/",
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    const educationLink = page.locator('a[href="/educacao/ba/salvador"]').first();
    await expect(educationLink).toHaveCount(0);

    await openPublicRoute(page, "/educacao/ba/salvador", { waitUntil: "domcontentloaded", dismissConsent: true });
    await expectRouteReady(page, {
      readyPattern: /MVP publico|MVP público|separado para ajustes/i,
    });
  });
});
