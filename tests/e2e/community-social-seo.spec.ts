import { expect, test } from "@playwright/test";
import { expectRouteReady, openPublicRoute, readRobots } from "./support/publicRouteAssertions";

test.describe("community social SEO policy", () => {
  test.setTimeout(180_000);

  test("feed route resolves as the social canonical surface", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/feed", { waitUntil: "domcontentloaded" });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/ba/salvador/feed",
      readyPattern: /Feed|Comunidade|Complexo do Nordeste/i,
    });

    expect((await readRobots(page)) ?? "index, follow").not.toMatch(/noindex/i);
  });

  test("groups route resolves as the social canonical surface", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/grupos", { waitUntil: "domcontentloaded" });
    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/ba/salvador/grupos",
      readyPattern: /Grupos|Comunidade|Complexo do Nordeste/i,
    });

    expect((await readRobots(page)) ?? "index, follow").not.toMatch(/noindex/i);
  });
});
