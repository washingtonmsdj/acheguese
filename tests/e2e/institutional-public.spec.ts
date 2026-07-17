import { expect, test } from "@playwright/test";
import {
  expectRouteReady,
  hasMainLandmark,
  openPublicRoute,
  readBodyText,
} from "./support/publicRouteAssertions";

test.describe("institutional public routes", () => {
  test.setTimeout(120_000);

  for (const route of [
    { path: "/sobre", expected: /Sobre o Achegue-se/i },
    { path: "/contato", expected: /Entre em Contato|Achegue-se/i },
    {
      path: "/termos",
      expected: /Termos de uso|Regras contratuais para uso do Achegue-se/i,
    },
    {
      path: "/privacidade",
      expected:
        /Politica de privacidade|Como o Achegue-se trata dados pessoais/i,
    },
    {
      path: "/dpo",
      expected:
        /Contato com o encarregado de dados|Solicite acesso, correcao, exclusao ou reporte uma violacao/i,
    },
  ]) {
    test(`${route.path} exposes canonical brand and accessible main content`, async ({
      page,
    }) => {
      await openPublicRoute(page, route.path);

      await expectRouteReady(page, {
        expectedUrlPart: route.path,
        readyPattern: route.expected,
        mainSelector: "main#main-content",
      });
      await expect
        .poll(() => hasMainLandmark(page, "main#main-content"), {
          timeout: 30_000,
        })
        .toBe(true);
      await expect
        .poll(
          async () =>
            (await readBodyText(page)).includes("Comunidade Conectada"),
          { timeout: 15_000 },
        )
        .toBe(false);
    });
  }

  test("/termos makes community guidelines part of the canonical legal document", async ({
    page,
  }) => {
    await openPublicRoute(page, "/termos", { waitUntil: "domcontentloaded" });

    await expectRouteReady(page, {
      expectedUrlPart: "/termos",
      readyPattern: /Diretrizes da comunidade/i,
      mainSelector: "main#main-content",
    });
    await expect(page.locator("#diretrizes-da-comunidade")).toBeVisible();
    await expect(
      page.getByText("N\u00e3o exponha dados pessoais", { exact: true }),
    ).toBeVisible();
  });

  test("/aceitar-termos exposes the signed-out post-provider entry safely", async ({
    page,
  }) => {
    await openPublicRoute(page, "/aceitar-termos", {
      waitUntil: "domcontentloaded",
    });

    await expectRouteReady(page, {
      expectedUrlPart: "/aceitar-termos",
      readyPattern: /Aceite dos Termos de Uso/i,
      mainSelector: "main#main-content",
    });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await expect(
      page.getByRole("link", { name: "Ir para entrar" }),
    ).toBeVisible();
  });
});
