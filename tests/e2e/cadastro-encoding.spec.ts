/**
 * E2E — Cadastro com estados/cidades/bairros persistidos com mojibake
 *
 * Cobre o contrato de normalização de encoding do fluxo de cadastro:
 *  - Mesmo que o backend/Supabase devolva nomes com mojibake ("SÃ£o Paulo"),
 *    a UI deve renderizar a versão normalizada ("São Paulo").
 *  - O usuário consegue selecionar essas opções normalmente e concluir o
 *    cadastro, chegando à tela de confirmação.
 *
 * Os endpoints de `locations` são interceptados para injetar payloads
 * mojibaked de forma determinística, sem depender do estado real do banco.
 */

import { expect, test } from "@playwright/test";

const UNIQUE = Date.now();
const EMAIL = `e2e-encoding-${UNIQUE}@example.com`;
const PASSWORD = "SenhaSegura@2026";

const STATE = {
  id: "00000000-0000-0000-0000-0000000000aa",
  parent_id: null,
  type: "state",
  slug: "sp",
  name: "SÃ£o Paulo", // mojibake proposital
  full_name: "SÃ£o Paulo",
  geographic_path: "/br/sp",
  status: "active",
  metadata: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const CITY = {
  ...STATE,
  id: "00000000-0000-0000-0000-0000000000bb",
  parent_id: STATE.id,
  type: "city",
  slug: "sao-goncalo",
  name: "SÃ£o Gon\u00c3\u00a7alo",
  full_name: "SÃ£o Gon\u00c3\u00a7alo",
  geographic_path: "/br/sp/sao-goncalo",
};

const NEIGHBORHOOD = {
  ...STATE,
  id: "00000000-0000-0000-0000-0000000000cc",
  parent_id: CITY.id,
  type: "neighborhood",
  slug: "amaralina",
  name: "Nordeste de Amaralina - Se\u00c3\u00a7\u00c3\u00a3o A",
  full_name: "Nordeste de Amaralina - Se\u00c3\u00a7\u00c3\u00a3o A",
  geographic_path: "/br/sp/sao-goncalo/amaralina",
};

test.describe("Cadastro — encoding de território", () => {
  test.beforeEach(async ({ page }) => {
    // signUp mockado
    await page.route(/\/auth\/v1\/signup/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e-user", email: EMAIL },
          session: null,
        }),
      }),
    );

    // Intercepta consultas à tabela `locations` no PostgREST e devolve os
    // payloads mojibaked de acordo com o filtro (type e parent_id).
    await page.route(/\/rest\/v1\/locations.*/, async (route) => {
      const url = route.request().url();
      let body: unknown = [];
      if (/type=eq\.state/.test(url) || /parent_id=is\.null/.test(url)) {
        body = [STATE];
      } else if (
        new RegExp(`parent_id=eq\\.${STATE.id}`).test(url) &&
        /type=eq\.city/.test(url)
      ) {
        body = [CITY];
      } else if (
        new RegExp(`parent_id=eq\\.${CITY.id}`).test(url) &&
        /type=eq\.neighborhood/.test(url)
      ) {
        body = [NEIGHBORHOOD];
      } else if (
        new RegExp(`parent_id=eq\\.${CITY.id}`).test(url) &&
        /type=eq\.district/.test(url)
      ) {
        body = [];
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
  });

  test("normaliza e permite selecionar valores mojibaked ate a confirmação", async ({
    page,
  }) => {
    await page.goto("/cadastro");

    await page.getByLabel(/Nome completo/i).fill("Ana Encoding");
    await page.getByLabel(/Nome de usuario/i).fill(`ana_enc_${UNIQUE}`);
    await page.getByLabel(/^Email/i).fill(EMAIL);
    await page.getByLabel(/^Senha/i).fill(PASSWORD);
    await page.getByLabel(/Confirmar senha/i).fill(PASSWORD);
    await page.getByRole("button", { name: /Próximo/i }).click();

    // Estado normalizado — a UI nunca deve mostrar "SÃ£o Paulo".
    await page.getByLabel(/Estado/i).click();
    await expect(page.getByRole("option", { name: "São Paulo" })).toBeVisible();
    await expect(page.getByRole("option", { name: /SÃ£o/ })).toHaveCount(0);
    await page.getByRole("option", { name: "São Paulo" }).click();

    await page.getByLabel(/Cidade/i).click();
    await expect(
      page.getByRole("option", { name: "São Gonçalo" }),
    ).toBeVisible();
    await page.getByRole("option", { name: "São Gonçalo" }).click();

    await page.getByLabel(/Bairro/i).click();
    await expect(
      page.getByRole("option", { name: /Nordeste de Amaralina - Seção A/ }),
    ).toBeVisible();
    await page
      .getByRole("option", { name: /Nordeste de Amaralina - Seção A/ })
      .click();

    await page.getByRole("button", { name: /Próximo/i }).click();
    await page.getByLabel(/Li e aceito os Termos/i).check();
    await page.getByRole("button", { name: /Criar minha conta/i }).click();

    await page.waitForURL(/\/cadastro\/confirmacao/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/cadastro\/confirmacao/);
  });
});
