import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  bootstrapFixtureSession,
  bootstrapProtectedPreviewAccess,
  hasE2EUserCredentials,
  requireE2EUserCredentials,
} from "./helpers/auth";

const FIXTURE_MARKER = "account-authenticated-e2e";
const BUSINESS_PREFIX = "G6 E2E Empresa Canonica";

test.setTimeout(180_000);

async function territoryComboboxByLabel(
  page: Page,
  labelPattern: RegExp,
  fallbackIndex: number,
): Promise<Locator> {
  const byLabel = page.getByRole("combobox", { name: labelPattern }).first();
  return (await byLabel.count()) > 0
    ? byLabel
    : page.getByRole("combobox").nth(fallbackIndex);
}

async function chooseEnabledOption(
  page: Page,
  trigger: Locator,
  preferredPatterns: RegExp[] = [],
): Promise<string> {
  await expect(trigger).toBeVisible({ timeout: 20_000 });
  await expect(trigger).toBeEnabled({ timeout: 30_000 });
  await trigger.click();

  const options = page.locator('[role="option"]:visible');
  await expect(options.first()).toBeVisible({ timeout: 15_000 });

  const count = await options.count();
  const enabled: Array<{ locator: Locator; label: string }> = [];

  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const label = (await option.textContent())?.trim() ?? "";
    const ariaDisabled = await option.getAttribute("aria-disabled");
    const dataDisabled = await option.getAttribute("data-disabled");
    if (!label || ariaDisabled === "true" || dataDisabled !== null) continue;
    enabled.push({ locator: option, label });
  }

  if (enabled.length === 0) {
    throw new Error("Nenhuma opcao territorial habilitada.");
  }

  const selected =
    enabled.find(({ label }) =>
      preferredPatterns.some((pattern) => pattern.test(label)),
    ) ?? enabled[0];

  await selected.locator.click();
  return selected.label;
}

async function fillBusinessTerritory(page: Page) {
  const state = await territoryComboboxByLabel(page, /^Estado/i, 0);
  const city = await territoryComboboxByLabel(page, /^Cidade/i, 1);
  const district = await territoryComboboxByLabel(
    page,
    /^(Bairro|Distrito)/i,
    2,
  );

  await chooseEnabledOption(page, state, [/bahia/i, /^ba$/i]);
  await chooseEnabledOption(page, city, [/salvador/i]);
  if ((await district.count()) > 0) {
    await chooseEnabledOption(page, district);
  }
}

async function assertDedicatedFixture(client: Awaited<ReturnType<typeof bootstrapFixtureSession>>) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw error ?? new Error("Fixture autenticada nao retornou usuario.");
  }

  const marker =
    data.user.app_metadata?.acheguese_fixture ??
    data.user.user_metadata?.acheguese_fixture;

  expect(marker).toBe(FIXTURE_MARKER);
  expect(data.user.email).toMatch(/@tests\.acheguese\.com\.br$/i);
  return data.user;
}

async function cleanupBusinessFixtures(
  client: Awaited<ReturnType<typeof bootstrapFixtureSession>>,
) {
  const { data: businesses, error } = await client
    .from("business_data")
    .select("profile_id, business_name, status")
    .ilike("business_name", `${BUSINESS_PREFIX}%`);

  if (error) throw error;

  for (const business of businesses ?? []) {
    if (!business.profile_id || !String(business.business_name).startsWith(BUSINESS_PREFIX)) {
      throw new Error("Cleanup recusado para empresa fora do prefixo tecnico G6.");
    }

    const { error: businessError } = await client
      .from("business_data")
      .update({ status: "deleted" })
      .eq("profile_id", business.profile_id);
    if (businessError) throw businessError;

    const { error: profileError } = await client
      .from("profiles")
      .update({ is_active: false })
      .eq("id", business.profile_id);
    if (profileError) throw profileError;
  }

  const { data: remaining, error: remainingError } = await client
    .from("business_data")
    .select("profile_id")
    .ilike("business_name", `${BUSINESS_PREFIX}%`)
    .eq("status", "active");
  if (remainingError) throw remainingError;
  expect(remaining ?? []).toEqual([]);
}

test.describe("Business lifecycle — fixture autenticada remota", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E Business exige a fixture remota E2E_USER_EMAIL/E2E_USER_PASSWORD.",
  );

  test("cria, edita, publica, gerencia e limpa empresa pelo owner", async ({
    page,
  }) => {
    const credentials = requireE2EUserCredentials();
    await page.context().clearCookies();
    await bootstrapProtectedPreviewAccess(page);
    await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });

    const client = await bootstrapFixtureSession(
      page,
      credentials.email,
      credentials.password,
    );
    await assertDedicatedFixture(client);
    await cleanupBusinessFixtures(client);

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const originalName = `${BUSINESS_PREFIX} ${suffix}`;
    const renamedName = `${originalName} Atualizada`;

    try {
      await page.goto("/central/empresas/nova/educacao", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: /Cadastrar instituição de ensino/i }),
      ).toBeVisible({ timeout: 30_000 });

      await page.locator("#name").fill(originalName);
      await page
        .locator("#description")
        .fill("Fixture tecnica G6 para certificacao do lifecycle Business.");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(
        page.getByRole("heading", { name: "Território, contato e operação" }),
      ).toBeVisible({ timeout: 20_000 });
      await page.locator("#phone").fill("(71) 99999-9999");
      await fillBusinessTerritory(page);
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(
        page.getByText("Mídia, canais públicos e operação complementar"),
      ).toBeVisible({ timeout: 20_000 });
      await page.getByRole("button", { name: "Criar empresa" }).click();

      await page.waitForURL(
        /\/central\/empresas\/[0-9a-f-]{36}\/educacao\/setup(?:\?|$)/i,
        { timeout: 40_000 },
      );
      const profileId =
        page.url().match(/\/central\/empresas\/([0-9a-f-]{36})\//i)?.[1];
      expect(profileId).toBeTruthy();

      await page.goto(`/edit-business/${profileId}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: "Editar Empresa" }),
      ).toBeVisible({ timeout: 30_000 });

      await page.locator("#name").fill(renamedName);
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByRole("button", { name: "Salvar alterações" }).click();

      await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(renamedName, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });

      await page.getByRole("button", { name: "Gerenciar empresa" }).click();
      await expect(page).toHaveURL(
        new RegExp(`/central/empresas/${profileId}(?:/|\\?|$)`),
        { timeout: 30_000 },
      );
      await expect(page.getByText(renamedName, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });

      await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Ver página pública" }).click();
      await expect(page).toHaveURL(/\/empresas\//, { timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name: renamedName }).first(),
      ).toBeVisible({ timeout: 30_000 });
    } finally {
      await cleanupBusinessFixtures(client);
    }

    await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Nenhuma empresa ativa")).toBeVisible({
      timeout: 30_000,
    });
  });
});
