import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { type User } from "@supabase/supabase-js";
import { login } from "../../e2e/helpers/auth";
import {
  createOperationalAnonClient,
  createOptionalOperationalAdminClient,
  hasOperationalAnonEnv,
  hasOperationalAdminEnv,
} from "../helpers/operational-env";

const admin = createOptionalOperationalAdminClient();
const repoRoot = process.cwd();

const CONSENT_FIXTURE = [
  { consent_type: "cookies", granted: true },
  { consent_type: "analytics", granted: true },
  { consent_type: "marketing", granted: false },
  { consent_type: "geolocation", granted: false },
  { consent_type: "privacy_policy", granted: true },
];

function hasSupabaseAdminEnv(): boolean {
  return Boolean(
    admin &&
      hasOperationalAnonEnv() &&
      hasOperationalAdminEnv(),
  );
}

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

async function gotoApp(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
}

async function clickWhenEnabled(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible({ timeout: 30000 });
  await expect(locator).toBeEnabled({ timeout: 30000 });
  await locator.click();
}

async function advanceOrderAction(input: {
  page: Page;
  orderUrl: string;
  actionName: RegExp;
  nextActionName: RegExp;
}): Promise<void> {
  const { page, orderUrl, actionName, nextActionName } = input;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nextButton = page.getByRole("button", { name: nextActionName }).first();
    if (await nextButton.isVisible().catch(() => false)) {
      return;
    }

    const actionButton = page.getByRole("button", { name: actionName }).first();
    await expect(actionButton).toBeVisible({ timeout: 30000 });
    await expect(actionButton).toBeEnabled({ timeout: 30000 });
    await actionButton.click();

    const advanced = await nextButton
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (advanced) {
      return;
    }

    await gotoApp(page, orderUrl);
  }

  throw new Error(
    `Acao operacional ${actionName} nao avancou para ${nextActionName}.`,
  );
}

async function dismissConsentBanner(page: Page): Promise<void> {
  const labels = ["Aceitar Todos", "Aceitar todos", "Fechar"];

  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => undefined);
      await expect(button)
        .toHaveCount(0, { timeout: 5000 })
        .catch(() => undefined);
      return;
    }
  }

  const banner = page.locator("[data-consent-banner]").first();
  if (await banner.isVisible().catch(() => false)) {
    const closeButton = banner.getByRole("button").first();
    await closeButton.click().catch(() => undefined);
  }
}

async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript((consents) => {
    window.localStorage.setItem("lgpd-consent", JSON.stringify(consents));
  }, CONSENT_FIXTURE);
}

async function createConfirmedUser(input: {
  email: string;
  password: string;
  name: string;
  handle: string;
}): Promise<{ user: User }> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para criar usuario confirmado.",
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      display_name: input.name,
      handle: input.handle,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("Falha ao criar usuario confirmado para o teste.");
  }

  return { user: data.user };
}

function createPublicClient() {
  return createOperationalAnonClient();
}

async function waitForPersonalProfile(userId: string): Promise<{ id: string }> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para consulta de perfil.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "personal")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data;
    }

    await delay(500);
  }

  throw new Error(`Perfil pessoal nao encontrado para ${userId}.`);
}

async function waitForBusinessProfile(
  userId: string,
): Promise<{ id: string } | null> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para consulta de perfil business.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "business")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return data;
    }

    await delay(500);
  }

  return null;
}

async function waitForBusinessPublication(businessName: string): Promise<{
  profile_id: string;
  slug: string;
  geographic_path: string;
}> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para consulta da empresa.",
    );
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await admin
      .from("business_data")
      .select(
        "profile_id, slug, location:locations!location_id(geographic_path)",
      )
      .eq("business_name", businessName)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const geographicPath = (
      data?.location as { geographic_path?: string | null } | null
    )?.geographic_path;
    if (data?.profile_id && data?.slug && geographicPath) {
      return {
        profile_id: data.profile_id,
        slug: data.slug,
        geographic_path: geographicPath,
      };
    }

    await delay(1000);
  }

  throw new Error(
    `Empresa "${businessName}" nao publicou slug/geographic_path a tempo.`,
  );
}

async function waitForOrderOperationalTimestamps(orderId: string): Promise<{
  accepted_at: string | null;
  preparing_at: string | null;
  ready_for_pickup_at: string | null;
}> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para consulta de timestamps do pedido.",
    );
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await admin
      .from("orders")
      .select("accepted_at, preparing_at, ready_for_pickup_at")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.accepted_at && data?.preparing_at && data?.ready_for_pickup_at) {
      return data;
    }

    await delay(1000);
  }

  throw new Error(
    `Timestamps operacionais nao ficaram completos para o pedido ${orderId}.`,
  );
}

async function waitForFavoriteRecord(input: {
  userId: string;
  businessDataId: string;
}): Promise<void> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para validar favorito.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("user_favorite_businesses")
      .select("id")
      .eq("user_id", input.userId)
      .eq("business_id", input.businessDataId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.id) {
      return;
    }

    await delay(500);
  }

  throw new Error(
    `Favorito nao foi persistido para user=${input.userId} business=${input.businessDataId}.`,
  );
}

async function findBootstrapLocation(): Promise<{
  id: string;
  geographic_path: string;
}> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para buscar localizacao.",
    );
  }

  const preferred = await admin
    .from("locations")
    .select("id, geographic_path")
    .eq("geographic_path", "/br/ba/salvador/nordeste-de-amaralina")
    .maybeSingle();

  if (preferred.error) {
    throw preferred.error;
  }

  if (preferred.data?.id && preferred.data.geographic_path) {
    return preferred.data;
  }

  const { data, error } = await admin
    .from("locations")
    .select("id, geographic_path")
    .ilike("geographic_path", "/br/ba/salvador/%")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id || !data.geographic_path) {
    throw (
      error ??
      new Error("Nenhuma localizacao operacional encontrada para bootstrap.")
    );
  }

  return data;
}

async function bootstrapBusinessForUser(input: {
  email: string;
  password: string;
  businessName: string;
  handle: string;
  slug: string;
}): Promise<{
  profileId: string;
  businessDataId: string;
  geographicPath: string;
  slug: string;
}> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para bootstrap da empresa.",
    );
  }

  const client = createPublicClient();
  const signIn = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (signIn.error || !signIn.data.user) {
    throw (
      signIn.error ??
      new Error("Falha ao autenticar usuario para bootstrap da empresa.")
    );
  }

  const location = await findBootstrapLocation();

  let businessProfile = await waitForBusinessProfile(signIn.data.user.id);

  if (!businessProfile?.id) {
    const rpc = await client.functions.invoke<{
      data?: { success?: boolean; error?: string };
      error?: string;
    }>("profile-rpc", {
      body: {
        action: "createProfile",
        params: {
          profileType: "business",
          handle: input.handle,
          displayName: input.businessName,
          avatarUrl: null,
          bio: "Perfil bootstrap para onboarding automatizado de gastronomia.",
          extensionData: {
            legal_name: input.businessName,
            location_id: location.id,
            category: "restaurante",
            subcategory: "pizzaria",
            description: "Bootstrap automatizado de empresa base para Gastronomia.",
            status: "active",
          },
        },
      },
    });

    if (rpc.error || rpc.data?.error || rpc.data?.data?.success === false) {
      throw rpc.error ?? new Error(rpc.data?.error ?? rpc.data?.data?.error ?? "Falha ao criar perfil business.");
    }

    businessProfile = await waitForBusinessProfile(signIn.data.user.id);
  }

  const profileId = businessProfile?.id;
  if (!profileId) {
    throw new Error("Perfil business nao foi criado para o vendedor E2E.");
  }

  await admin.from("profile_members").upsert(
    {
      profile_id: profileId,
      user_id: signIn.data.user.id,
      role: "owner",
    },
    { onConflict: "profile_id,user_id" },
  );

  const existingBusiness = await admin
    .from("business_data")
    .select("id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  if (existingBusiness.error) {
    throw existingBusiness.error;
  }

  let businessDataId = existingBusiness.data?.id ?? null;

  if (businessDataId) {
    const update = await admin
      .from("business_data")
      .update({
        business_name: input.businessName,
        description: "Empresa base bootstrapada para fluxo E2E de Gastronomia.",
        category: "restaurante",
        subcategory: "pizzaria",
        slug: input.slug,
        location_id: location.id,
        status: "active",
      })
      .eq("id", businessDataId);

    if (update.error) {
      throw update.error;
    }
  } else {
    const insert = await admin
      .from("business_data")
      .insert({
        profile_id: profileId,
        business_name: input.businessName,
        description: "Empresa base bootstrapada para fluxo E2E de Gastronomia.",
        category: "restaurante",
        subcategory: "pizzaria",
        slug: input.slug,
        location_id: location.id,
        status: "active",
      })
      .select("id")
      .single();

    if (insert.error) {
      throw insert.error;
    }

    businessDataId = insert.data?.id ?? null;
  }

  if (!businessDataId) {
    throw new Error("business_data nao foi criado para a empresa E2E.");
  }

  await client.auth.signOut();

  return {
    profileId,
    businessDataId,
    geographicPath: location.geographic_path,
    slug: input.slug,
  };
}

function buildGastronomyPublicUrl(
  geographicPath: string,
  slug: string,
): string {
  const parts = geographicPath.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 4) {
    throw new Error(
      `geographic_path invalido para rota publica: ${geographicPath}`,
    );
  }

  const [, state, city, district] = parts;
  return `/gastronomia/${state}/${city}/${district}/${slug}`;
}

async function clickFirstEnabledOption(
  options: Locator,
  preferredPatterns: RegExp[] = [],
): Promise<string> {
  await expect(options.first()).toBeVisible({ timeout: 15000 });
  const optionCount = await options.count();
  const enabledOptions: Array<{ option: Locator; label: string }> = [];

  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);
    const ariaDisabled = await option.getAttribute("aria-disabled");
    const dataDisabled = await option.getAttribute("data-disabled");
    const label = (await option.textContent())?.trim() || "";

    if (
      ariaDisabled === "true" ||
      dataDisabled !== null ||
      !label ||
      /selecione/i.test(label)
    ) {
      continue;
    }

    enabledOptions.push({ option, label });
  }

  if (!enabledOptions.length) {
    throw new Error("Nenhuma opcao habilitada encontrada no combobox.");
  }

  const preferred = enabledOptions.find(({ label }) =>
    preferredPatterns.some((pattern) => pattern.test(label)),
  );
  const selected = preferred ?? enabledOptions[0];
  await selected.option.click();
  return selected.label;
}

async function clickFirstEnabledOptionInCombobox(
  page: Page,
  trigger: Locator,
  preferredPatterns: RegExp[] = [],
): Promise<string> {
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await expect
    .poll(
      async () => {
        const disabled =
          (await trigger.getAttribute("disabled")) !== null ||
          (await trigger.getAttribute("data-disabled")) !== null;
        return !disabled;
      },
      { timeout: 30000 },
    )
    .toBe(true);

  await trigger.click();
  return clickFirstEnabledOption(
    page.locator('[role="option"]:visible'),
    preferredPatterns,
  );
}

async function selectNamedOptionInCombobox(
  page: Page,
  trigger: Locator,
  optionName: RegExp,
): Promise<void> {
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await expect
    .poll(
      async () => {
        const disabled =
          (await trigger.getAttribute("disabled")) !== null ||
          (await trigger.getAttribute("data-disabled")) !== null;
        return !disabled;
      },
      { timeout: 30000 },
    )
    .toBe(true);

  await trigger.click();
  await page.getByRole("option", { name: optionName }).click();
}

async function territoryComboboxByLabel(
  page: Page,
  labelPattern: RegExp,
  fallbackIndex: number,
): Promise<Locator> {
  const byLabel = page.getByRole("combobox", { name: labelPattern }).first();
  if ((await byLabel.count()) > 0) {
    return byLabel;
  }
  return page.getByRole("combobox").nth(fallbackIndex);
}

async function selectStateThatEnablesCity(
  page: Page,
  stateCombobox: Locator,
  cityCombobox: Locator,
): Promise<void> {
  await expect(stateCombobox).toBeVisible({ timeout: 15000 });
  await expect(stateCombobox).toBeEnabled({ timeout: 30000 });

  await stateCombobox.click();
  const optionCount = await page.locator('[role="option"]:visible').count();

  for (let index = 0; index < optionCount; index += 1) {
    await stateCombobox.click();
    const option = page.locator('[role="option"]:visible').nth(index);
    const label = (await option.textContent())?.trim() || "";
    if (!label || /selecione/i.test(label)) {
      continue;
    }

    await option.click();

    const cityEnabled = await expect
      .poll(
        async () => {
          return (
            (await cityCombobox.getAttribute("disabled")) === null &&
            (await cityCombobox.getAttribute("data-disabled")) === null
          );
        },
        { timeout: 3000 },
      )
      .toBe(true)
      .then(() => true)
      .catch(() => false);

    if (cityEnabled) {
      return;
    }
  }

  throw new Error(
    "Nenhum estado habilitou a selecao de cidade no cadastro de empresa.",
  );
}

async function fillBusinessTerritory(page: Page) {
  const legacyStateTrigger = page.locator("#territorial-state");
  if ((await legacyStateTrigger.count()) > 0) {
    const legacyCityTrigger = page.locator("#territorial-city");
    await selectNamedOptionInCombobox(page, legacyStateTrigger, /bahia/i);
    await expect(legacyStateTrigger).toContainText(/bahia/i, {
      timeout: 15000,
    });
    await selectNamedOptionInCombobox(page, legacyCityTrigger, /salvador/i);
    await expect(legacyCityTrigger).toContainText(/salvador/i, {
      timeout: 15000,
    });

    const neighborhoodTrigger = page.locator("#territorial-neighborhood");
    if ((await neighborhoodTrigger.count()) > 0) {
      await clickFirstEnabledOptionInCombobox(page, neighborhoodTrigger);
    }
    return;
  }

  const stateCombobox = await territoryComboboxByLabel(page, /^Estado/i, 0);
  const cityCombobox = await territoryComboboxByLabel(page, /^Cidade/i, 1);
  const localityCombobox = await territoryComboboxByLabel(
    page,
    /^(Bairro|Distrito)/i,
    2,
  );

  await selectNamedOptionInCombobox(page, stateCombobox, /bahia/i);
  await expect(stateCombobox).toContainText(/bahia/i, { timeout: 15000 });
  await selectNamedOptionInCombobox(page, cityCombobox, /salvador/i);
  await expect(cityCombobox).toContainText(/salvador/i, { timeout: 15000 });

  if (await localityCombobox.count()) {
    await clickFirstEnabledOptionInCombobox(page, localityCombobox);
  }
}

async function setSwitchByLabel(page: Page, label: string, desired: boolean) {
  const labelNode = page.getByText(new RegExp(`^${label}$`, "i")).first();
  const row = labelNode.locator(
    'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"items-center") and contains(@class,"justify-between")][1]',
  );
  const switchControl = row.getByRole("switch").first();

  await expect(switchControl).toBeVisible({ timeout: 15000 });
  const checked = (await switchControl.getAttribute("aria-checked")) === "true";
  if (checked !== desired) {
    await switchControl.click();
  }
}

test("keeps pizza and a basic niche covered by the onboarding release contract", () => {
  const e2eSource = readProjectFile("tests/e2e/gastronomy-onboarding.spec.ts");
  const setupPageSource = readProjectFile(
    "src/modules/business/gastronomy/pages/GastronomySetupPage.tsx",
  );
  const pizzaPresetSource = readProjectFile(
    "src/modules/business/gastronomy/niches/presets/pizza.ts",
  );
  const lanchesPresetSource = readProjectFile(
    "src/modules/business/gastronomy/niches/presets/lanches.ts",
  );

  expect(e2eSource).toContain("Pizzaria");
  expect(e2eSource).toContain("Confirmar pedido");
  expect(e2eSource).toContain("advanceOrderAction");
  expect(setupPageSource).toContain("CUISINE_TYPES.map");
  expect(setupPageSource).toContain("getCuisineLabel(type)");

  expect(pizzaPresetSource).toContain("nicheKey: 'pizza'");
  expect(pizzaPresetSource).toContain("supportLevel: 'full_enabled'");
  expect(pizzaPresetSource).toContain("isSelectable: true");
  expect(pizzaPresetSource).toContain("isPublic: true");
  expect(pizzaPresetSource).toContain("'pizza_half_half'");

  expect(lanchesPresetSource).toContain("nicheKey: 'lanches'");
  expect(lanchesPresetSource).toContain("supportLevel: 'basic_enabled'");
  expect(lanchesPresetSource).toContain("isSelectable: true");
  expect(lanchesPresetSource).toContain("isPublic: true");
  expect(lanchesPresetSource).toContain("'basic_menu'");
});

test.describe("gastronomy onboarding e2e", () => {
  test.skip(
    !hasSupabaseAdminEnv(),
    "Defina VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );

  test("new seller creates a pizzaria, adds first product, and a second user buys it", async ({
    page,
    browser,
  }) => {
    test.setTimeout(360_000);

    const suffix = uniqueSuffix();
    const sellerEmail = `gastronomy-seller-${suffix}@example.com`;
    const buyerEmail = `gastronomy-buyer-${suffix}@example.com`;
    const password = "Gastronomy@2026!";
    const businessName = `Pizzaria E2E ${suffix}`;
    const businessSlug = `pizzaria-e2e-${suffix}`;
    const itemName = `Refrigerante E2E ${suffix}`;

    const seller = await createConfirmedUser({
      email: sellerEmail,
      password,
      name: "Lojista Gastronomia E2E",
      handle: `gastroseller${suffix}`,
    });
    await waitForPersonalProfile(seller.user.id);

    const buyer = await createConfirmedUser({
      email: buyerEmail,
      password,
      name: "Cliente Gastronomia E2E",
      handle: `gastrobuyer${suffix}`,
    });
    await waitForPersonalProfile(buyer.user.id);

    const bootstrap = await bootstrapBusinessForUser({
      email: sellerEmail,
      password,
      businessName,
      handle: `pizzariae2e${suffix}`,
      slug: businessSlug,
    });

    await seedConsent(page);
    await login(page, sellerEmail, password);
    await gotoApp(
      page,
      `/central/empresas/${bootstrap.profileId}/gastronomia/setup`,
    );
    await dismissConsentBanner(page);

    const businessProfileId = bootstrap.profileId;

    await expect(
      page.getByRole("heading", {
        name: /(Ativar Modulo Gastronomia|Configurar Gastronomia)/i,
      }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /Pizzaria/i }).click();
    await setSwitchByLabel(page, "Retirada", true);
    await page.getByRole("button", { name: /Ativar Gastronomia/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/central/empresas/${businessProfileId}/gastronomia$`),
      {
        timeout: 90000,
      },
    );
    await expect(
      page.getByRole("heading", { name: /Dashboard Gastronomia/i }),
    ).toBeVisible({ timeout: 30000 });

    await gotoApp(
      page,
      `/central/empresas/${businessProfileId}/gastronomia/cardapio`,
    );
    await expect(
      page.getByRole("heading", { name: /Gest[aã]o de Card[aá]pio/i }),
    ).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(/Nenhum card[aá]pio encontrado/i)).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: /Novo Item/i }).click();
    const itemDialog = page.getByRole("dialog");
    await expect(
      itemDialog.getByRole("heading", { name: /Novo Item/i }),
    ).toBeVisible({
      timeout: 15000,
    });

    await itemDialog.getByLabel("Nome").fill(itemName);
    await itemDialog
      .getByLabel(/Descri/i)
      .fill("Produto inicial do fluxo E2E.");
    await itemDialog.locator('input[type="number"]').first().fill("12.5");

    const categoryCombobox = itemDialog.getByRole("combobox");
    if ((await categoryCombobox.count()) > 0) {
      await categoryCombobox.first().click();
      await page.getByRole("option", { name: /Sem categoria/i }).click();
    }

    await itemDialog.getByRole("button", { name: /^Criar$/i }).click();
    await expect(itemDialog).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText(itemName)).toBeVisible({ timeout: 30000 });

    const publicUrl = buildGastronomyPublicUrl(
      bootstrap.geographicPath,
      bootstrap.slug,
    );

    const buyerContext = await browser.newContext();
    const buyerPage = await buyerContext.newPage();

    await seedConsent(buyerPage);
    await login(buyerPage, buyerEmail, password);
    await gotoApp(buyerPage, publicUrl);
    await dismissConsentBanner(buyerPage);

    await expect(
      buyerPage.getByRole("heading", { name: businessName }),
    ).toBeVisible({ timeout: 30000 });

    await buyerPage
      .getByRole("button", { name: /Adicionar aos favoritos/i })
      .click();
    await expect(
      buyerPage.getByRole("button", { name: /Remover dos favoritos/i }),
    ).toBeVisible({ timeout: 15000 });
    await waitForFavoriteRecord({
      userId: buyer.user.id,
      businessDataId: bootstrap.businessDataId,
    });

    await gotoApp(buyerPage, "/gastronomia/favoritos");
    await expect(
      buyerPage.getByRole("heading", { name: /Meus Favoritos/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(buyerPage.getByText(businessName).first()).toBeVisible({
      timeout: 30000,
    });

    await gotoApp(buyerPage, publicUrl);
    await expect(
      buyerPage.getByRole("heading", { name: businessName }),
    ).toBeVisible({ timeout: 30000 });

    const openMenuCta = buyerPage
      .getByRole("link", {
        name: /Ver card[aá]pio e pedir|Abrir card[aá]pio|Pedir agora/i,
      })
      .first();
    if (await openMenuCta.isVisible().catch(() => false)) {
      await openMenuCta.click();
      await expect(
        buyerPage.getByRole("heading", { name: /Card[aá]pio/i }),
      ).toBeVisible({ timeout: 30000 });
    }

    await expect(buyerPage.getByText(itemName)).toBeVisible({ timeout: 30000 });

    await buyerPage
      .getByRole("button", { name: /^Adicionar$/i })
      .first()
      .click();
    const drawer = buyerPage.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: itemName })).toBeVisible({
      timeout: 20000,
    });
    await drawer
      .getByRole("button", { name: /Adicionar ao carrinho/i })
      .click();

    await expect(
      buyerPage.getByRole("button", { name: /Continuar checkout/i }),
    ).toBeVisible({
      timeout: 20000,
    });
    await buyerPage
      .getByRole("button", { name: /Continuar checkout/i })
      .click();

    await expect(
      buyerPage.getByRole("heading", { name: /Confirmar pedido/i }),
    ).toBeVisible({ timeout: 30000 });
    await buyerPage
      .locator("button")
      .filter({ hasText: /^Retirada$/i })
      .first()
      .click();
    await buyerPage.getByRole("button", { name: /Confirmar pedido/i }).click();

    await buyerPage.waitForURL(/\/gastronomia\/pedidos\/[^/]+$/, {
      timeout: 90000,
    });
    const orderId =
      buyerPage.url().match(/\/gastronomia\/pedidos\/([^/?#]+)/)?.[1] ?? null;
    expect(orderId).toBeTruthy();

    await expect(
      buyerPage.getByRole("heading", { name: /Pedido #/i }),
    ).toBeVisible({ timeout: 30000 });
    await expect(buyerPage.getByText(itemName)).toBeVisible({ timeout: 30000 });

    await gotoApp(
      page,
      `/central/empresas/${businessProfileId}/gastronomia/pedidos/${orderId}`,
    );

    await expect(page.getByRole("heading", { name: /Pedido #/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(itemName)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Cliente Gastronomia E2E/i)).toBeVisible({
      timeout: 30000,
    });

    const adminOrderUrl = `/central/empresas/${businessProfileId}/gastronomia/pedidos/${orderId}`;

    await advanceOrderAction({
      page,
      orderUrl: adminOrderUrl,
      actionName: /Aceitar pedido/i,
      nextActionName: /Iniciar preparo/i,
    });
    await advanceOrderAction({
      page,
      orderUrl: adminOrderUrl,
      actionName: /Iniciar preparo/i,
      nextActionName: /Marcar pronto/i,
    });
    await advanceOrderAction({
      page,
      orderUrl: adminOrderUrl,
      actionName: /Marcar pronto/i,
      nextActionName: /Marcar retirado/i,
    });

    const timestamps = await waitForOrderOperationalTimestamps(orderId!);

    await expect(
      page.getByRole("button", { name: /Marcar retirado/i }),
    ).toBeVisible({
      timeout: 30000,
    });

    expect(timestamps.accepted_at).toBeTruthy();
    expect(timestamps.preparing_at).toBeTruthy();
    expect(timestamps.ready_for_pickup_at).toBeTruthy();

    await buyerContext.close();
  });
});
