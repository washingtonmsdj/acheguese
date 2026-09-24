import { expect, test } from "@playwright/test";

import { hasE2EUserCredentials } from "./helpers/auth";
import { DEFAULT_MOBILE_VIEWPORT } from "./support/publicRouteAssertions";
import { loginAsUserWithRetry } from "./support/privateRouteAssertions";

type BackCase = {
  name: string;
  from: string;
  label: string;
  expected: RegExp;
};

const BACK_CASES: readonly BackCase[] = [
  {
    name: "alterar e-mail volta para Dados de acesso",
    from: "/conta/seguranca#email",
    label: "Voltar para Dados de acesso",
    expected: /\/conta\/seguranca#acesso$/,
  },
  {
    name: "alterar senha volta para Segurança",
    from: "/conta/seguranca#senha",
    label: "Voltar para Segurança",
    expected: /\/conta\/seguranca$/,
  },
  {
    name: "duas etapas volta para Segurança",
    from: "/conta/seguranca#mfa",
    label: "Voltar para Segurança",
    expected: /\/conta\/seguranca$/,
  },
  {
    name: "exportação volta para Privacidade e dados",
    from: "/conta/privacidade#exportar",
    label: "Voltar para Privacidade e dados",
    expected: /\/conta\/privacidade$/,
  },
  {
    name: "histórico volta para Privacidade e dados",
    from: "/conta/privacidade#historico",
    label: "Voltar para Privacidade e dados",
    expected: /\/conta\/privacidade$/,
  },
  {
    name: "acessibilidade volta para Preferências",
    from: "/conta/preferencias#acessibilidade",
    label: "Voltar para Preferências",
    expected: /\/conta\/preferencias$/,
  },
  {
    name: "endereços volta para Preferências",
    from: "/conta/enderecos",
    label: "Voltar para Preferências",
    expected: /\/conta\/preferencias$/,
  },
  {
    name: "configurações da identidade volta para Preferências",
    from: "/conta/perfil/configuracoes?tab=links",
    label: "Voltar para Preferências",
    expected: /\/conta\/preferencias$/,
  },
  {
    name: "notificações volta para Minha conta",
    from: "/conta/notificacoes",
    label: "Voltar para Minha conta",
    expected: /\/conta$/,
  },
] as const;

test.setTimeout(120_000);

test.describe("Minha conta — hierarquia de retorno mobile", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhuma credencial padrão é inventada.",
  );

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DEFAULT_MOBILE_VIEWPORT);
    await loginAsUserWithRetry(page);
  });

  for (const scenario of BACK_CASES) {
    test(scenario.name, async ({ page }) => {
      await page.goto(scenario.from, { waitUntil: "domcontentloaded" });
      const back = page.getByRole("button", { name: scenario.label });
      await expect(back).toBeVisible({ timeout: 30_000 });
      await back.click();
      await expect(page).toHaveURL(scenario.expected, { timeout: 30_000 });
    });
  }
});
