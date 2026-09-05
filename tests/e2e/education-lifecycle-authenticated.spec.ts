import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  bootstrapFixtureSession,
  bootstrapProtectedPreviewAccess,
  hasE2EUserCredentials,
  requireE2EUserCredentials,
} from "./helpers/auth";

const FIXTURE_MARKER = "account-authenticated-e2e";
const EDUCATION_PREFIX = "G6 E2E Education";

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

async function selectRadixOption(
  page: Page,
  triggerTestId: string,
  optionName: string,
) {
  await page.getByTestId(triggerTestId).click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

async function assertDedicatedFixture(
  client: Awaited<ReturnType<typeof bootstrapFixtureSession>>,
) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw error ?? new Error("Fixture autenticada nao retornou usuario.");
  }

  const marker =
    data.user.app_metadata?.acheguese_fixture ??
    data.user.user_metadata?.acheguese_fixture;

  expect(marker).toBe(FIXTURE_MARKER);
  expect(data.user.email).toMatch(/@tests\.acheguese\.com\.br$/i);
}

async function cleanupEducationFixtures(
  client: Awaited<ReturnType<typeof bootstrapFixtureSession>>,
) {
  const { data: businesses, error } = await client
    .from("business_data")
    .select("profile_id, business_name, status")
    .ilike("business_name", `${EDUCATION_PREFIX}%`);

  if (error) throw error;

  for (const business of businesses ?? []) {
    if (
      !business.profile_id ||
      !String(business.business_name).startsWith(EDUCATION_PREFIX)
    ) {
      throw new Error("Cleanup Education recusado para fixture fora do prefixo.");
    }

    const { error: educationError } = await client
      .from("education_profiles")
      .delete()
      .eq("business_id", business.profile_id);
    if (educationError) throw educationError;

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
    .ilike("business_name", `${EDUCATION_PREFIX}%`)
    .eq("status", "active");

  if (remainingError) throw remainingError;
  expect(remaining ?? []).toEqual([]);
}

test.describe("Education lifecycle — fixture autenticada remota", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E Education exige E2E_USER_EMAIL/E2E_USER_PASSWORD.",
  );

  test("configura escola, gerencia programa e prova limites FREE", async ({
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
    await cleanupEducationFixtures(client);

    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const businessName = `${EDUCATION_PREFIX} ${suffix}`;

    try {
      await page.goto("/central/empresas/nova/educacao", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          name: /Cadastrar instituição de ensino/i,
        }),
      ).toBeVisible({ timeout: 30_000 });

      await page.locator("#name").fill(businessName);
      await page
        .locator("#description")
        .fill("Fixture tecnica G6 para certificacao operacional Education.");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(
        page.getByRole("heading", {
          name: "Território, contato e operação",
        }),
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
      const businessProfileId =
        page.url().match(/\/central\/empresas\/([0-9a-f-]{36})\//i)?.[1];
      expect(businessProfileId).toBeTruthy();

      await expect(page.getByTestId("education-setup-form")).toBeVisible({
        timeout: 30_000,
      });
      await selectRadixOption(
        page,
        "education-institution-type-trigger",
        "Escola",
      );
      await selectRadixOption(
        page,
        "education-niche-trigger",
        "Escola Regular",
      );
      await selectRadixOption(
        page,
        "education-school-type-trigger",
        "Privada",
      );
      await selectRadixOption(
        page,
        "education-school-network-trigger",
        "Privada",
      );
      await page.getByLabel("Ensino Fundamental - Anos Iniciais").check();
      await page.getByLabel("Manha").check();
      await page
        .getByTestId("education-summary")
        .fill("Escola técnica E2E configurada pelo owner autenticado.");
      await page.getByTestId("education-whatsapp").fill("+5571999999999");
      await page.getByTestId("education-save-setup").click();

      await expect(page).toHaveURL(
        new RegExp(
          `/central/empresas/${businessProfileId}/educacao(?:\\?|$)`,
        ),
        { timeout: 30_000 },
      );

      const { data: educationProfile, error: educationProfileError } =
        await client
          .from("education_profiles")
          .select("id, niche_key, institution_type, status")
          .eq("business_id", businessProfileId!)
          .single();

      expect(educationProfileError).toBeNull();
      expect(educationProfile?.niche_key).toBe("regular_school");
      expect(educationProfile?.institution_type).toBe("school");
      expect(educationProfile?.status).toBe("draft");

      await page.goto(
        `/central/empresas/${businessProfileId}/educacao/programas`,
        { waitUntil: "domcontentloaded" },
      );
      await expect(
        page.getByRole("heading", { name: "Programas e Turmas" }),
      ).toBeVisible({ timeout: 30_000 });

      await page.getByRole("button", { name: "Novo Programa" }).click();
      const stageSelect = page.locator("#gradeOption");
      const stageOption = stageSelect.locator("option").nth(1);
      const programName = (await stageOption.textContent())?.trim() ?? "";
      expect(programName).not.toBe("");
      await stageSelect.selectOption({ index: 1 });
      await page.locator("#availableSlots").fill("12");
      await page.getByRole("button", { name: "Criar Programa" }).click();

      await expect(
        page.getByText(programName, { exact: true }).first(),
      ).toBeVisible({ timeout: 30_000 });

      const { data: program, error: programError } = await client
        .from("education_programs")
        .select("id, name, is_active, available_slots")
        .eq("education_profile_id", educationProfile!.id)
        .eq("name", programName)
        .single();

      expect(programError).toBeNull();
      expect(program?.is_active).toBe(true);
      expect(program?.available_slots).toBe(12);

      const actions = page.getByRole("button", {
        name: `Ações do programa ${programName}`,
      });
      await actions.click();
      await page.getByRole("menuitem", { name: "Editar" }).click();
      const activeSwitch = page.getByRole("switch", {
        name: "Programa ativo",
      });
      await expect(activeSwitch).toBeChecked();
      await activeSwitch.click();
      await page.getByRole("button", { name: "Salvar Alterações" }).click();

      await expect(page.getByText("Inativo", { exact: true })).toBeVisible({
        timeout: 30_000,
      });

      const { data: inactiveProgram, error: inactiveError } = await client
        .from("education_programs")
        .select("is_active")
        .eq("id", program!.id)
        .single();
      expect(inactiveError).toBeNull();
      expect(inactiveProgram?.is_active).toBe(false);

      await actions.click();
      await page.getByRole("menuitem", { name: "Editar" }).click();
      await expect(activeSwitch).not.toBeChecked();
      await activeSwitch.click();
      await page.getByRole("button", { name: "Salvar Alterações" }).click();
      await expect(page.getByText("Inativo", { exact: true })).toHaveCount(0);

      await page.goto(
        `/central/empresas/${businessProfileId}/educacao/leads`,
        { waitUntil: "domcontentloaded" },
      );
      await expect(
        page.getByRole("heading", { name: "Gestão de Leads" }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("button", { name: /Novo Lead/i }),
      ).toHaveCount(0);

      await page.goto(
        `/central/empresas/${businessProfileId}/educacao/eventos`,
        { waitUntil: "domcontentloaded" },
      );
      const newEvent = page.getByRole("button", { name: "Novo Evento" });
      await expect(newEvent).toBeVisible({ timeout: 30_000 });
      await expect(newEvent).toBeDisabled();
      await expect(
        page.getByText(/apenas em planos pagos/i).first(),
      ).toBeVisible({ timeout: 30_000 });

      await page.goto(
        `/central/empresas/${businessProfileId}/educacao/analytics`,
        { waitUntil: "domcontentloaded" },
      );
      await expect(
        page.getByRole("heading", { name: "Analytics" }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByText(/plano|upgrade/i).first(),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("body")).not.toContainText(
        /Nao foi possivel carregar o Analytics/i,
      );
    } finally {
      await cleanupEducationFixtures(client);
    }

    await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(businessName, { exact: true })).toHaveCount(0);
  });
});
