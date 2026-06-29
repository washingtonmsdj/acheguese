import { expect, test } from "@playwright/test";
import { expectRouteReady, openPublicRoute, readBodyText } from "./support/publicRouteAssertions";

test.describe("community opportunities public surface", () => {
  test.setTimeout(180_000);

  test("paused opportunities tab falls back to the community surface", async ({ page }) => {
    await openPublicRoute(page, "/comunidade/ba/salvador/feed?tab=oportunidades", {
      waitUntil: "domcontentloaded",
    });

    await expectRouteReady(page, {
      expectedUrlPart: "/comunidade/ba/salvador/feed",
      readyPattern: /Feed|Comunidade|Complexo|Salvador/i,
    });

    await expect.poll(() => readBodyText(page), { timeout: 60_000 }).not.toMatch(/Publicar vaga|Vagas proximas|Vagas próximas/i);
  });
});
