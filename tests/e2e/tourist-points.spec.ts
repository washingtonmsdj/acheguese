import { expect, test } from "@playwright/test";

test.describe("guide public smoke", () => {
  test.setTimeout(120_000);

  test("guide entry route does not render a blank shell", async ({ page }) => {
    await page.goto("/guia", { waitUntil: "domcontentloaded", timeout: 90_000 });

    await expect
      .poll(() => page.locator("body").innerText().catch(() => ""), { timeout: 60_000 })
      .toMatch(/Guia|Turismo|Achegue-se|Pontos/i);
  });
});
