import { expect, test, type Page } from "@playwright/test";
import { type User } from "@supabase/supabase-js";
import { login } from "../../e2e/helpers/auth";
import {
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

const COMMUNITY_ROUTE = "/comunidade/ba/salvador/nordeste-de-amaralina/feed";
const COMMUNITY_LOCATION_PATH = "/br/ba/salvador/nordeste-de-amaralina";

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

async function seedConsent(page: Page): Promise<void> {
  await page.addInitScript((consents) => {
    window.localStorage.setItem("lgpd-consent", JSON.stringify(consents));
  }, CONSENT_FIXTURE);
}

async function gotoApp(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
}

async function createConfirmedUser(input: {
  email: string;
  password: string;
  name: string;
  handle: string;
}): Promise<{ user: User }> {
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
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
    throw error ?? new Error("Falha ao criar usuario confirmado.");
  }

  return { user: data.user };
}

async function waitForPersonalProfile(userId: string): Promise<{ id: string }> {
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "personal")
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return data;

    await delay(500);
  }

  throw new Error(`Perfil pessoal nao encontrado para ${userId}.`);
}

async function setActiveProfile(input: {
  userId: string;
  profileId: string;
}): Promise<void> {
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const { error } = await admin.from("user_active_profiles").upsert(
    {
      user_id: input.userId,
      profile_id: input.profileId,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

async function findCommunityLocation(): Promise<{ id: string }> {
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const preferred = await admin
    .from("locations")
    .select("id")
    .eq("geographic_path", COMMUNITY_LOCATION_PATH)
    .maybeSingle();

  if (preferred.error) throw preferred.error;
  if (preferred.data?.id) return preferred.data;

  const { data, error } = await admin
    .from("locations")
    .select("id")
    .ilike("geographic_path", "/br/ba/salvador/%")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw error ?? new Error("Nenhuma localizacao comunitaria encontrada.");
  }

  return data;
}

async function seedVerifiedResidence(input: {
  userId: string;
  locationId: string;
}): Promise<void> {
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const now = new Date().toISOString();
  const address = await admin
    .from("addresses")
    .insert({
      owner_user_id: input.userId,
      location_id: input.locationId,
      address_type: "exact",
      street: "Rua E2E Comunidade",
      number: "100",
      postal_code: "40000000",
      precision: "street",
      is_verified: true,
      verification_status: "verified",
      verified_at: now,
      verified_reason: "e2e_verified_resident",
      metadata: { source: "community-access-gate-e2e" },
    })
    .select("id")
    .single();

  if (address.error || !address.data?.id) {
    throw address.error ?? new Error("Falha ao criar endereco verificado.");
  }

  const residence = await admin.from("user_residences").insert({
    user_id: input.userId,
    address_id: address.data.id,
    location_id: input.locationId,
    country: "BR",
    is_primary: true,
    is_verified: true,
    verification_requested_at: now,
  });

  if (residence.error) throw residence.error;
}

test.describe("community access gate e2e", () => {
  test.skip(
    !hasSupabaseAdminEnv(),
    "Defina VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY.",
  );

  test("authenticated user without local residence sees address setup gate", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    const suffix = uniqueSuffix();
    const password = "CommunityGate@2026!";
    const user = await createConfirmedUser({
      email: `community-no-residence-${suffix}@example.com`,
      password,
      name: "Morador Sem Endereco E2E",
      handle: `semendereco${suffix}`,
    });
    const profile = await waitForPersonalProfile(user.user.id);
    await setActiveProfile({ userId: user.user.id, profileId: profile.id });

    await seedConsent(page);
    await login(page, user.user.email!, password);
    await gotoApp(page, COMMUNITY_ROUTE);

    await expect(
      page.getByRole("heading", {
        name: "Confirme sua residencia neste territorio",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "Cadastrar endereco" }),
    ).toBeVisible();
  });

  test("verified resident can access member feed actions", async ({ page }) => {
    test.setTimeout(180_000);

    const suffix = uniqueSuffix();
    const password = "CommunityGate@2026!";
    const user = await createConfirmedUser({
      email: `community-verified-${suffix}@example.com`,
      password,
      name: "Morador Verificado E2E",
      handle: `verificado${suffix}`,
    });
    const profile = await waitForPersonalProfile(user.user.id);
    await setActiveProfile({ userId: user.user.id, profileId: profile.id });
    const location = await findCommunityLocation();
    await seedVerifiedResidence({
      userId: user.user.id,
      locationId: location.id,
    });

    await seedConsent(page);
    await login(page, user.user.email!, password);
    await gotoApp(page, COMMUNITY_ROUTE);

    await expect(
      page.getByRole("heading", {
        name: "Confirme sua residencia neste territorio",
      }),
    ).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByRole("feed", { name: "Feed da comunidade" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", {
        name: /O que voce quer compartilhar|O que você quer compartilhar/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
