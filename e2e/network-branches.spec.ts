import { expect, test } from "@playwright/test";

test.describe("network branches smoke", () => {
  test("root route exposes a public entry point", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 90_000 });

    await expect
      .poll(() => page.locator("body").innerText().catch(() => ""), { timeout: 60_000 })
      .toMatch(/Achegue-se|Entrar no Meu Bairro|Cadastrar/i);
  });
});
