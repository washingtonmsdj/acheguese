import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loginAsUser } from "../../e2e/helpers/auth";

const TEST_EMAIL = process.env.E2E_USER_EMAIL || "";
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

let PROFESSIONAL_DATA_ID: string | null = null;

function testClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signInTestUser() {
  if (!TEST_EMAIL || !TEST_PASSWORD || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const client = testClient();
  const signIn = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signIn.error || !signIn.data.user) return null;
  return { client, userId: signIn.data.user.id };
}

async function ensureProfessionalData(): Promise<string | null> {
  const session = await signInTestUser();
  if (!session) return null;
  const { client, userId } = session;
  const location = await client
    .from("locations")
    .select("id, geographic_path")
    .eq("type", "district")
    .ilike("geographic_path", "%/salvador/%")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .maybeSingle();
  const locationId = location.data?.id ?? null;
  if (!locationId) {
    await client.auth.signOut();
    return null;
  }

  const existingProfile = await client
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_type", "professional")
    .limit(1)
    .maybeSingle();

  let professionalProfileId = existingProfile.data?.id ?? null;
  if (!professionalProfileId) {
    const suffix = Date.now().toString().slice(-6);
    await client.rpc("create_profile_with_extension", {
      p_profile_type: "professional",
      p_handle: `e2e-prof-${suffix}`,
      p_display_name: `Profissional E2E ${suffix}`,
      p_avatar_url: null,
      p_bio: "Perfil profissional bootstrap E2E.",
      p_extension_data: {
        professional_name: `Profissional E2E ${suffix}`,
        profession: "Eletricista",
        location_id: locationId,
        service_category: "manutencao",
        service_subcategory: "eletricista",
        description: "Profissional para fluxo E2E.",
        is_accepting_clients: true,
        status: "active",
      },
    });

    const refreshed = await client
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("profile_type", "professional")
      .limit(1)
      .maybeSingle();
    professionalProfileId = refreshed.data?.id ?? null;
  }

  if (!professionalProfileId) {
    await client.auth.signOut();
    return null;
  }

  await client.from("profile_members").upsert(
    {
      profile_id: professionalProfileId,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "profile_id,user_id" },
  );

  const existingProfessionalData = await client
    .from("professional_data")
    .select("id")
    .eq("profile_id", professionalProfileId)
    .limit(1)
    .maybeSingle();

  let professionalDataId = existingProfessionalData.data?.id ?? null;
  if (!professionalDataId) {
    const created = await client
      .from("professional_data")
      .insert({
        profile_id: professionalProfileId,
        professional_name: "Profissional E2E",
        profession: "Eletricista",
        location_id: locationId,
        service_category: "manutencao",
        service_subcategory: "eletricista",
        description: "Profissional para fluxo E2E.",
        is_verified: false,
        is_accepting_clients: true,
        status: "active",
      })
      .select("id")
      .single();

    professionalDataId = created.data?.id ?? null;
  } else {
    await client
      .from("professional_data")
      .update({
        is_accepting_clients: true,
        status: "active",
        location_id: locationId,
        profession: "Eletricista",
      })
      .eq("id", professionalDataId);
  }

  await client.auth.signOut();
  return professionalDataId;
}

async function createLeadFixture(professionalDataId: string): Promise<string | null> {
  const session = await signInTestUser();
  if (!session) return null;
  const { client, userId } = session;

  const personalProfile = await client
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_type", "personal")
    .limit(1)
    .maybeSingle();

  const requesterProfileId = personalProfile.data?.id ?? null;
  if (!requesterProfileId) {
    await client.auth.signOut();
    return null;
  }

  const token = Date.now().toString().slice(-6);
  const leadInsert = await client
    .from("professional_leads")
    .insert({
      professional_id: professionalDataId,
      requester_user_id: userId,
      requester_profile_id: requesterProfileId,
      requester_name: "Cliente E2E",
      requester_phone: "71999999999",
      service_needed: `Servico E2E ${token}`,
      description: "Fluxo E2E profissional: lead, proposta, aceite, atendimento e avaliacao.",
      neighborhood: "Nordeste de Amaralina",
      source_channel: "e2e",
      status: "new",
      priority: "normal",
      metadata: { source: "playwright-professional-e2e" },
    })
    .select("id")
    .single();

  const leadId = leadInsert.data?.id ?? null;
  if (!leadId) {
    await client.auth.signOut();
    return null;
  }

  await client.from("professional_lead_messages").insert({
    lead_id: leadId,
    sender_user_id: userId,
    sender_role: "requester",
    message: "Mensagem inicial do cliente no fluxo E2E.",
  });

  const quoteInsert = await client
    .from("professional_lead_quotes")
    .insert({
      lead_id: leadId,
      professional_user_id: userId,
      amount_cents: 18990,
      currency: "BRL",
      description: "Proposta estruturada E2E.",
      estimated_duration: "2 horas",
      status: "sent",
    })
    .select("id")
    .single();

  const quoteId = quoteInsert.data?.id ?? null;
  if (!quoteId) {
    await client.auth.signOut();
    return leadId;
  }

  await client
    .from("professional_lead_quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId)
    .select("id")
    .single();

  const engagement = await client
    .from("professional_service_engagements")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (engagement.data?.id) {
    await client
      .from("professional_service_engagements")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", engagement.data.id);
  }

  await client.auth.signOut();
  return leadId;
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
}

test.describe("professional leads authenticated flow", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async () => {
    PROFESSIONAL_DATA_ID = await ensureProfessionalData();
  });

  test("tracking + central profissional render lead/proposal/engagement pipeline", async ({ page }) => {
    test.skip(
      !TEST_EMAIL || !TEST_PASSWORD,
      "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para validar fluxo autenticado de profissionais.",
    );

    test.skip(!PROFESSIONAL_DATA_ID, "Nao foi possivel bootstrapar professional_data para o usuario E2E.");

    const leadId = await createLeadFixture(PROFESSIONAL_DATA_ID!);
    test.skip(!leadId, "Nao foi possivel criar fixture de lead profissional.");

    await loginAsUser(page);

    await open(page, `/servicos/orcamentos/${leadId}`);
    await expect(page.getByText(/propostas recebidas/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/atendimento contratado/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/avaliar atendimento concluido/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/conversa do orcamento/i)).toBeVisible({ timeout: 20_000 });

    await open(page, "/central/profissional");
    await expect(page.getByRole("heading", { name: /central profissional/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/pedidos de orcamento/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/atendimentos contratados/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/servico e2e/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
