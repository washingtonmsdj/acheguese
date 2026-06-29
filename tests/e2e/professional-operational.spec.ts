import { test } from "@playwright/test";
import { expectRouteReady, openPublicRoute } from "./support/publicRouteAssertions";

test.describe("professional operational routes", () => {
  test.setTimeout(150_000);

  test("tracking route does not stay stuck on the global suspense loader", async ({ page }) => {
    await openPublicRoute(page, "/servicos", { timeoutMs: 15_000 });
    await expectRouteReady(page, {
      readyPattern: /Serviços|Servicos|Profissional|Eletricista/i,
    });

    await openPublicRoute(page, "/servicos/orcamentos/fake-lead-id", { timeoutMs: 15_000 });
    await expectRouteReady(page, {
      readyPattern: /Acompanhar or[çc]amento|Or[çc]amento n[aã]o encontrado/i,
    });
  });

  test("services landing route resolves beyond the global suspense loader", async ({ page }) => {
    await openPublicRoute(page, "/servicos", { timeoutMs: 15_000 });
    await expectRouteReady(page, {
      readyPattern: /Serviços|Servicos|Profissional|Eletricista/i,
    });
  });
});
