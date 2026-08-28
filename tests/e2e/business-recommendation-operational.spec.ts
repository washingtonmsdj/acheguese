import { expect, test, type Locator, type Page } from "@playwright/test";
import { type User } from "@supabase/supabase-js";
import { login } from "./helpers/auth";
import {
  createOperationalAnonClient,
  createOptionalOperationalAdminClient,
  hasOperationalAnonEnv,
  hasOperationalAdminEnv,
} from "../helpers/operational-env";

const admin = createOptionalOperationalAdminClient();

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

function createPublicClient() {
  return createOperationalAnonClient();
}

async function gotoApp(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
}

async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript((consents) => {
    window.localStorage.setItem("lgpd-consent", JSON.stringify(consents));
  }, CONSENT_FIXTURE);
}

async function dismissConsentBanner(page: Page): Promise<void> {
  const button = page
    .getByRole("button", { name: /Aceitar Todos|Aceitar todos|Fechar/i })
    .first();

  if (await button.isVisible().catch(() => false)) {
    await button.click().catch(() => undefined);
  }
}

async function clickWhenEnabled(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible({ timeout: 30000 });
  await expect(locator).toBeEnabled({ timeout: 30000 });
  await locator.click();
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

async function bootstrapInstitutionalBusinessForUser(input: {
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
          bio: "Perfil bootstrap para E2E institucional de empresas.",
          extensionData: {
            legal_name: input.businessName,
            location_id: location.id,
            category: "servicos",
            subcategory: "consultoria",
            description: "Bootstrap automatizado de empresa institucional.",
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
    throw new Error("Perfil business nao foi criado para a empresa E2E.");
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
  const businessPayload = {
    business_name: input.businessName,
    description: "Empresa institucional usada para validar recomendacoes.",
    category: "servicos",
    subcategory: "consultoria",
    slug: input.slug,
    location_id: location.id,
    status: "active",
    business_address: "Rua E2E, 100",
    business_city: "Salvador",
    business_state: "BA",
    metadata: {
      phone: "71999990000",
      whatsapp: "5571999990000",
      modos_atendimento: ["presencial"],
    },
  };

  if (businessDataId) {
    const update = await admin
      .from("business_data")
      .update(businessPayload)
      .eq("id", businessDataId);

    if (update.error) {
      throw update.error;
    }
  } else {
    const insert = await admin
      .from("business_data")
      .insert({
        profile_id: profileId,
        ...businessPayload,
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

  await admin.from("gastronomy_profiles").delete().eq("business_id", businessDataId);
  await client.auth.signOut();

  return {
    profileId,
    businessDataId,
    geographicPath: location.geographic_path,
    slug: input.slug,
  };
}

function buildCompanyPublicUrl(geographicPath: string, slug: string): string {
  const parts = geographicPath.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 4) {
    throw new Error(
      `geographic_path invalido para rota publica: ${geographicPath}`,
    );
  }

  const [, state, city, district] = parts;
  return `/empresas/${state}/${city}/${district}/${slug}`;
}

function buildCompanyListUrl(geographicPath: string): string {
  const parts = geographicPath.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 4) {
    throw new Error(
      `geographic_path invalido para rota de lista: ${geographicPath}`,
    );
  }

  const [, state, city, district] = parts;
  return `/empresas/${state}/${city}/${district}`;
}

async function waitForRecommendationRecord(input: {
  userId: string;
  businessDataId: string;
}): Promise<void> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para validar recomendacao.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("user_recommended_businesses")
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
    `Recomendacao nao foi persistida para user=${input.userId} business=${input.businessDataId}.`,
  );
}

async function waitForNoRecommendationRecord(input: {
  userId: string;
  businessDataId: string;
}): Promise<void> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para validar recomendacao.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("user_recommended_businesses")
      .select("id")
      .eq("user_id", input.userId)
      .eq("business_id", input.businessDataId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      return;
    }

    await delay(500);
  }

  throw new Error(
    `Recomendacao nao foi removida para user=${input.userId} business=${input.businessDataId}.`,
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

async function waitForNoFavoriteRecord(input: {
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

    if (!data?.id) {
      return;
    }

    await delay(500);
  }

  throw new Error(
    `Favorito nao foi removido para user=${input.userId} business=${input.businessDataId}.`,
  );
}

async function waitForRecommendationsCount(
  businessDataId: string,
  expectedCount: number,
): Promise<void> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para validar contador.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("business_data")
      .select("recommendations_count")
      .eq("id", businessDataId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.recommendations_count === expectedCount) {
      return;
    }

    await delay(500);
  }

  throw new Error(
    `Contador de recomendacoes nao chegou a ${expectedCount} para ${businessDataId}.`,
  );
}

async function waitForFavoritesCount(
  businessDataId: string,
  expectedCount: number,
): Promise<void> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada para validar contador.",
    );
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("business_data")
      .select("favorites_count")
      .eq("id", businessDataId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data?.favorites_count === expectedCount) {
      return;
    }

    await delay(500);
  }

  throw new Error(
    `Contador de favoritos nao chegou a ${expectedCount} para ${businessDataId}.`,
  );
}

test.describe("business engagement e2e", () => {
  test.skip(
    !hasSupabaseAdminEnv(),
    "Defina VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );

  test("authenticated user saves, recommends and toggles an institutional company", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const suffix = uniqueSuffix();
    const sellerEmail = `company-seller-${suffix}@example.com`;
    const buyerEmail = `company-buyer-${suffix}@example.com`;
    const password = "Company@2026!";
    const businessName = `Empresa Servicos E2E ${suffix}`;
    const businessSlug = `empresa-servicos-e2e-${suffix}`;

    const seller = await createConfirmedUser({
      email: sellerEmail,
      password,
      name: "Lojista Empresa E2E",
      handle: `companyseller${suffix}`,
    });
    await waitForPersonalProfile(seller.user.id);

    const buyer = await createConfirmedUser({
      email: buyerEmail,
      password,
      name: "Cliente Empresa E2E",
      handle: `companybuyer${suffix}`,
    });
    await waitForPersonalProfile(buyer.user.id);

    const business = await bootstrapInstitutionalBusinessForUser({
      email: sellerEmail,
      password,
      businessName,
      handle: `empresae2e${suffix}`,
      slug: businessSlug,
    });
    const publicUrl = buildCompanyPublicUrl(
      business.geographicPath,
      business.slug,
    );
    const listUrl = buildCompanyListUrl(business.geographicPath);

    await seedConsent(page);
    await login(page, buyerEmail, password);
    await gotoApp(page, listUrl);
    await dismissConsentBanner(page);

    await page.getByRole("searchbox", { name: /Buscar empresas/i }).fill(businessName);
    const businessCard = page
      .getByRole("article", {
        name: new RegExp(businessName, "i"),
      })
      .first();
    await expect(businessCard).toBeVisible({ timeout: 30000 });

    const listFavoriteButton = businessCard
      .getByRole("button", { name: /^Adicionar aos favoritos$/i })
      .first();
    await clickWhenEnabled(listFavoriteButton);
    await expect(
      businessCard.getByRole("button", { name: /^Remover dos favoritos$/i }),
    ).toBeVisible({ timeout: 15000 });
    await waitForFavoriteRecord({
      userId: buyer.user.id,
      businessDataId: business.businessDataId,
    });
    await waitForFavoritesCount(business.businessDataId, 1);

    await gotoApp(page, publicUrl);

    await expect(
      page.getByRole("heading", { name: businessName }),
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("link", { name: /Ver card.pio e pedir/i }),
    ).toHaveCount(0);

    const savedButton = page.getByRole("button", { name: /^Salvo$/i }).first();
    await expect(savedButton).toBeVisible({ timeout: 15000 });
    await expect(savedButton).toHaveAttribute("aria-pressed", "true");

    const recommendButton = page
      .getByRole("button", { name: /^Recomendar$/i })
      .first();
    await expect(recommendButton).toHaveAttribute("aria-pressed", "false");
    await clickWhenEnabled(recommendButton);

    const recommendedButton = page
      .getByRole("button", { name: /^Recomendado$/i })
      .first();
    await expect(recommendedButton).toBeVisible({ timeout: 15000 });
    await expect(recommendedButton).toHaveAttribute("aria-pressed", "true");
    await waitForRecommendationRecord({
      userId: buyer.user.id,
      businessDataId: business.businessDataId,
    });
    await waitForRecommendationsCount(business.businessDataId, 1);

    await gotoApp(page, publicUrl);
    await expect(
      page.getByRole("button", { name: /^Salvo$/i }),
    ).toHaveAttribute("aria-pressed", "true", { timeout: 30000 });
    await expect(
      page.getByRole("button", { name: /^Recomendado$/i }),
    ).toHaveAttribute("aria-pressed", "true", { timeout: 30000 });

    await clickWhenEnabled(
      page.getByRole("button", { name: /^Recomendado$/i }).first(),
    );
    await expect(
      page.getByRole("button", { name: /^Recomendar$/i }),
    ).toHaveAttribute("aria-pressed", "false", { timeout: 15000 });
    await waitForNoRecommendationRecord({
      userId: buyer.user.id,
      businessDataId: business.businessDataId,
    });
    await waitForRecommendationsCount(business.businessDataId, 0);

    await clickWhenEnabled(
      page.getByRole("button", { name: /^Salvo$/i }).first(),
    );
    await expect(
      page.getByRole("button", { name: /^Salvar$/i }),
    ).toHaveAttribute("aria-pressed", "false", { timeout: 15000 });
    await waitForNoFavoriteRecord({
      userId: buyer.user.id,
      businessDataId: business.businessDataId,
    });
    await waitForFavoritesCount(business.businessDataId, 0);
  });
});
