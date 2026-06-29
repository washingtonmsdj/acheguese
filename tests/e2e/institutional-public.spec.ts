import { expect, test, type Page } from "@playwright/test";

async function openPublicRoute(page: Page, path: string) {
  await page.goto(path, {
    timeout: 15_000,
    waitUntil: "commit",
  });
}

async function readBodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

async function hasMainContent(page: Page) {
  return page.evaluate(() => Boolean(document.querySelector("main#main-content"))).catch(() => false);
}

test.describe("institutional public routes", () => {
  test.setTimeout(120_000);

  for (const route of [
    { path: "/sobre", expected: /Sobre o Achegue-se/i },
    { path: "/contato", expected: /Entre em Contato|Achegue-se/i },
    { path: "/termos", expected: /Termos de uso|Regras contratuais para uso do Achegue-se/i },
    { path: "/regras", expected: /Regras da comunidade|Regras para manter a comunidade util e segura/i },
    { path: "/privacidade", expected: /Politica de privacidade|Como o Achegue-se trata dados pessoais/i },
    { path: "/dpo", expected: /Contato com o encarregado de dados|Solicite acesso, correcao, exclusao ou reporte uma violacao/i },
  ]) {
    test(`${route.path} exposes canonical brand and accessible main content`, async ({ page }) => {
      await openPublicRoute(page, route.path);

      await expect
        .poll(() => readBodyText(page), { timeout: 60_000 })
        .toMatch(route.expected);
      await expect
        .poll(() => hasMainContent(page), { timeout: 30_000 })
        .toBe(true);
      await expect
        .poll(async () => (await readBodyText(page)).includes("Comunidade Conectada"))
        .toBe(false);
    });
  }
});
