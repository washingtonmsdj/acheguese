import { test } from "@playwright/test";
import { hasE2EUserCredentials } from "./helpers/auth";
import { DEFAULT_MOBILE_VIEWPORT } from "./support/publicRouteAssertions";
import {
  expectMobilePrivateSurface,
  loginAsUserWithRetry,
} from "./support/privateRouteAssertions";

const MOBILE_AUTH_ROUTES = [
  {
    name: "central home",
    path: "/central",
    expectedUrlPattern: /\/central(\?|$)/i,
  },
  {
    name: "central empresas",
    path: "/central/empresas",
    expectedUrlPattern: /\/central\/empresas(\?|$)/i,
  },
  {
    name: "central motorista corridas",
    path: "/central/motorista/corridas",
    expectedUrlPattern: /\/central\/motorista\/corridas(\?|$)/i,
  },
  {
    name: "central motoboy entregas",
    path: "/central/motoboy/entregas",
    expectedUrlPattern: /\/central\/motoboy\/(entregas|cadastro)(\?|$)/i,
  },
  {
    name: "conta seguranca",
    path: "/conta/seguranca",
    expectedUrlPattern: /\/conta\/seguranca(\?|$)/i,
  },
  {
    name: "conta hub",
    path: "/conta",
    expectedUrlPattern: /\/conta(\?|$)/i,
  },
  {
    name: "conta editar perfil",
    path: "/conta/editar",
    expectedUrlPattern: /\/conta\/editar\/[^/?#]+(\?|$)/i,
  },
  {
    name: "conta enderecos",
    path: "/conta/enderecos",
    expectedUrlPattern: /\/conta\/enderecos(\?|$)/i,
  },
  {
    name: "conta preferencias",
    path: "/conta/preferencias",
    expectedUrlPattern: /\/conta\/preferencias(\?|$)/i,
  },
  {
    name: "conta notificacoes",
    path: "/conta/notificacoes",
    expectedUrlPattern: /\/conta\/notificacoes(\?|$)/i,
  },
  {
    name: "conta privacidade",
    path: "/conta/privacidade",
    expectedUrlPattern: /\/conta\/privacidade(\?|$)/i,
  },
  {
    name: "conta perfil configuracoes",
    path: "/conta/perfil/configuracoes?tab=links",
    expectedUrlPattern: /\/conta\/perfil\/configuracoes\?tab=links$/i,
  },
  {
    name: "legacy conta preferencias tab redireciona",
    path: "/conta/preferencias?tab=privacy",
    expectedUrlPattern: /\/conta\/perfil\/configuracoes(\?|$)/i,
  },
] as const;

test.setTimeout(120_000);

test.describe("Mobile authenticated dashboards", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhuma credencial padrão é inventada.",
  );

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DEFAULT_MOBILE_VIEWPORT);
    await loginAsUserWithRetry(page);
  });

  for (const route of MOBILE_AUTH_ROUTES) {
    test(`${route.name} em 360px`, async ({ page }) => {
      await expectMobilePrivateSurface(page, route);
    });
  }
});
