import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import {
  createOperationalAnonClient,
  getOperationalEnv,
  hasOperationalAnonEnv,
} from "../helpers/operational-env";

const operationalEnv = getOperationalEnv();
const TEST_EMAIL = operationalEnv.driverEmail || "";
const TEST_PASSWORD = operationalEnv.driverPassword || "";

let PROFESSIONAL_DATA_ID: string | null = null;
let PROFESSIONAL_COVERAGE_LABEL: string | null = null;

interface LeadFixture {
  leadId: string;
  professionalProfileId: string;
}

function testClient() {
  return createOperationalAnonClient();
}

async function signInTestUser() {
  if (!TEST_EMAIL || !TEST_PASSWORD || !hasOperationalAnonEnv()) return null;
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
    .select("id, name, geographic_path")
    .eq("type", "district")
    .ilike("geographic_path", "%/salvador/%")
    .order("geographic_path", { ascending: true })
    .limit(1)
    .maybeSingle();
  const locationId = location.data?.id ?? null;
  PROFESSIONAL_COVERAGE_LABEL = location.data?.name ?? null;
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
    const rpc = await client.functions.invoke<{
      data?: { success?: boolean; error?: string };
      error?: string;
    }>("profile-rpc", {
      body: {
        action: "createProfile",
        params: {
          profileType: "professional",
          handle: `e2e-prof-${suffix}`,
          displayName: `Profissional E2E ${suffix}`,
          avatarUrl: null,
          bio: "Perfil profissional bootstrap E2E.",
          extensionData: {
            professional_name: `Profissional E2E ${suffix}`,
            profession: "Eletricista",
            location_id: locationId,
            service_category: "manutencao",
            service_subcategory: "eletricista",
            description: "Profissional para fluxo E2E.",
            is_accepting_clients: true,
            status: "active",
          },
        },
      },
    });

    if (rpc.error || rpc.data?.error || rpc.data?.data?.success === false) {
      throw rpc.error ?? new Error(rpc.data?.error ?? rpc.data?.data?.error ?? "Falha ao criar perfil profissional.");
    }

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
        available_hours: {
          segunda: "08:00-18:00",
          terca: "08:00-18:00",
        },
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
        available_hours: {
          segunda: "08:00-18:00",
          terca: "08:00-18:00",
        },
      })
      .eq("id", professionalDataId);
  }

  if (professionalDataId) {
    const coverage = await client.rpc("replace_entity_coverage", {
      p_entity_type: "service_provider",
      p_entity_id: professionalDataId,
      p_coverages: [
        {
          coverage_type: "district",
          location_id: locationId,
          radius_km: null,
          is_primary: true,
        },
      ],
    });
    if (coverage.error) throw coverage.error;
  }

  await client.auth.signOut();
  return professionalDataId;
}

async function createLeadFixture(professionalDataId: string): Promise<LeadFixture | null> {
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

  const professionalData = await client
    .from("professional_data")
    .select("profile_id")
    .eq("id", professionalDataId)
    .limit(1)
    .maybeSingle();
  const professionalProfileId = professionalData.data?.profile_id ?? null;
  if (!professionalProfileId) {
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
    return { leadId, professionalProfileId };
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
  return { leadId, professionalProfileId };
}

async function resolveReviewerProfileId(
  client: ReturnType<typeof testClient>,
  userId: string,
): Promise<string | null> {
  const personalProfile = await client
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("profile_type", "personal")
    .limit(1)
    .maybeSingle();
  return personalProfile.data?.id ?? null;
}

async function assertProfessionalReviewPersistedWithSession(
  client: ReturnType<typeof testClient>,
  reviewerProfileId: string,
  professionalProfileId: string,
  commentToken: string,
): Promise<boolean> {
  const review = await client
    .from("reviews")
    .select("id")
    .eq("reviewed_profile_id", professionalProfileId)
    .eq("reviewer_profile_id", reviewerProfileId)
    .eq("review_type", "professional")
    .eq("status", "active")
    .ilike("comment", `%${commentToken}%`)
    .limit(1)
    .maybeSingle();

  return Boolean(review.data?.id);
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
}

async function bodyText(page: Page) {
  return page.evaluate(() => document.body.innerText).catch(() => "");
}

function comparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

    const fixture = await createLeadFixture(PROFESSIONAL_DATA_ID!);
    test.skip(!fixture, "Nao foi possivel criar fixture de lead profissional.");
    const { leadId, professionalProfileId } = fixture!;
    const reviewToken = `E2E review ${Date.now()}`;

    await loginAsUser(page);

    await open(page, `/servicos/orcamentos/${leadId}`);
    await expect(page.getByText(/propostas recebidas/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/atendimento contratado/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/avaliar atendimento conclu[ií]do/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/conversa do or[cç]amento/i)).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder(/conte como foi o atendimento/i).fill(reviewToken);
    await page.getByRole("button", { name: /enviar avalia[cç][aã]o/i }).click();

    const verifySession = await signInTestUser();
    test.skip(!verifySession, "Nao foi possivel iniciar sessao de verificacao para review.");
    const reviewerProfileId = await resolveReviewerProfileId(verifySession!.client, verifySession!.userId);
    test.skip(!reviewerProfileId, "Nao foi possivel resolver perfil pessoal para verificacao de review.");

    await expect
      .poll(
        async () =>
          assertProfessionalReviewPersistedWithSession(
            verifySession!.client,
            reviewerProfileId!,
            professionalProfileId,
            reviewToken,
          ),
        {
          timeout: 40_000,
        },
      )
      .toBe(true);
    await verifySession!.client.auth.signOut();

    await open(page, "/central/profissional");
    await expect.poll(() => bodyText(page), { timeout: 60_000 }).toMatch(/central|perfil profissional/i);
    await expect
      .poll(async () => (await bodyText(page)).toLowerCase().includes("verificando acesso"), {
        timeout: 60_000,
      })
      .toBe(false);

    await expect
      .poll(async () => {
        const text = comparableText(await bodyText(page));
        const hasOperationalPanel =
          text.includes("operacao profissional") ||
          text.includes("pedidos de orcamento") ||
          text.includes("atendimentos contratados");
        const hasProfessionalEmptyState =
          text.includes("perfil profissional") && text.includes("cadastrar servi");
        return hasOperationalPanel || hasProfessionalEmptyState;
      }, { timeout: 60_000 })
      .toBe(true);

    const centralText = await bodyText(page);
    const centralTextLower = comparableText(centralText);
    const hasOperationalPanel =
      centralTextLower.includes("operacao profissional") ||
      centralTextLower.includes("pedidos de orcamento") ||
      centralTextLower.includes("atendimentos contratados");
    const hasNoServiceState = centralTextLower.includes("nenhum servico publicado ainda");
    const hasProfessionalEmptyState =
      centralTextLower.includes("perfil profissional") && centralTextLower.includes("cadastrar servi");

    if (hasOperationalPanel && !hasNoServiceState) {
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/pedidos de orcamento/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/atendimentos contratados/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/servico e2e/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/dados operacionais do perfil/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/raio de atendimento/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/(nao se aplica|km)/i);
      if (PROFESSIONAL_COVERAGE_LABEL) {
        await expect
          .poll(
            async () =>
              comparableText(await bodyText(page)).includes(
                comparableText(PROFESSIONAL_COVERAGE_LABEL ?? ""),
              ),
            { timeout: 60_000 },
          )
          .toBe(true);
      }
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/(segunda: 08:00-18:00|nao informado)/i);
    }

    if (hasNoServiceState) {
      await expect
        .poll(async () => comparableText(await bodyText(page)), { timeout: 60_000 })
        .toMatch(/cadastrar servico/i);
    }

    if (hasProfessionalEmptyState) {
      const registerButton = page.getByRole("button", { name: /cadastrar servi[çc]os/i });
      const hasRegisterButton = await registerButton.isVisible().catch(() => false);
      if (hasRegisterButton) {
        await registerButton.click();
        await expect(page).toHaveURL(/\/services\/cadastrar/i, { timeout: 20_000 });
      }
    }
  });
});
