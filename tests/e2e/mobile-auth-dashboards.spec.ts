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
    name: "conta dados de acesso",
    path: "/conta/seguranca#acesso",
    expectedUrlPattern: /\/conta\/seguranca#acesso$/i,
  },
  {
    name: "conta alterar email de acesso",
    path: "/conta/seguranca#email",
    expectedUrlPattern: /\/conta\/seguranca#email$/i,
  },
  {
    name: "conta alterar senha",
    path: "/conta/seguranca#senha",
    expectedUrlPattern: /\/conta\/seguranca#senha$/i,
  },
  {
    name: "conta configurar duas etapas",
    path: "/conta/seguranca#mfa",
    expectedUrlPattern: /\/conta\/seguranca#mfa$/i,
  },
  {
    name: "conta hub",
    path: "/conta",
    expectedUrlPattern: /\/conta(\?|$)/i,
  },
  {
    name: "conta meus perfis",
    path: "/conta?section=profiles",
    expectedUrlPattern: /\/conta\?section=profiles$/i,
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
    name: "conta acessibilidade",
    path: "/conta/preferencias#acessibilidade",
    expectedUrlPattern: /\/conta\/preferencias#acessibilidade$/i,
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
    name: "conta exportar dados",
    path: "/conta/privacidade#exportar",
    expectedUrlPattern: /\/conta\/privacidade#exportar$/i,
  },
  {
    name: "conta historico de consentimentos",
    path: "/conta/privacidade#historico",
    expectedUrlPattern: /\/conta\/privacidade#historico$/i,
  },
  {
    name: "conta perfil configuracoes",
    path: "/conta/perfil/configuracoes?tab=links",
    expectedUrlPattern: /\/conta\/perfil\/configuracoes\?tab=links$/i,
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
