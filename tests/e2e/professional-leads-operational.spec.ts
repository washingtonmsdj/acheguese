import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "../../e2e/helpers/auth";
import {
  createOperationalAnonClient,
  createOptionalOperationalAdminClient,
  getMissingOperationalEnv,
  getOperationalEnv,
} from "../helpers/operational-env";
import {
  createConfirmedOperationalUser,
  deleteOperationalUserWithOwnedProfiles,
  getOperationalActiveProfileId,
} from "../helpers/operational-auth-fixture";

const operationalEnv = getOperationalEnv();
const REQUESTER_EMAIL = operationalEnv.driverEmail || "";
const REQUESTER_PASSWORD = operationalEnv.driverPassword || "";
const PROFESSIONAL_FLOW_ENV_ISSUES = getMissingOperationalEnv({
  requireAnonKey: true,
  requireDriverCredentials: true,
  requireServiceRole: true,
});

let PROFESSIONAL_DATA_ID: string | null = null;
let PROFESSIONAL_EMAIL = "";
let PROFESSIONAL_PASSWORD = "";
let PROFESSIONAL_USER_ID: string | null = null;
const CREATED_FIXTURES: LeadFixture[] = [];

interface LeadFixture {
  leadId: string;
  professionalProfileId: string;
  requesterProfileId: string;
}

function testClient() {
  return createOperationalAnonClient();
}

async function signInTestUser() {
  return signInActor(REQUESTER_EMAIL, REQUESTER_PASSWORD, "requester");
}

async function signInProfessionalUser() {
  return signInActor(PROFESSIONAL_EMAIL, PROFESSIONAL_PASSWORD, "professional");
}

async function signInActor(email: string, password: string, actor: string) {
  if (!email || !password || PROFESSIONAL_FLOW_ENV_ISSUES.length > 0)
    return null;
  const client = testClient();
  const signIn = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signIn.error || !signIn.data.user) {
    throw new Error(
      `Nao foi possivel autenticar o ator E2E ${actor}: ${signIn.error?.message ?? "usuario ausente"}`,
    );
  }
  return { client, userId: signIn.data.user.id };
}

async function provisionProfessionalActor(): Promise<void> {
  const admin = createOptionalOperationalAdminClient();
  if (!admin) return;

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  PROFESSIONAL_EMAIL = `e2e-professional-${suffix}@example.com`;
  PROFESSIONAL_PASSWORD = `Professional@${suffix}!`;
  const displayName = "Profissional E2E";
  const handle = `e2eprof${Date.now().toString().slice(-10)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const createdUser = await createConfirmedOperationalUser(admin, {
    email: PROFESSIONAL_EMAIL,
    handle,
    name: displayName,
    password: PROFESSIONAL_PASSWORD,
    userMetadata: {
      e2e_fixture: "professional-lead-flow",
    },
  });

  PROFESSIONAL_USER_ID = createdUser.id;
}

async function ensureProfessionalData(): Promise<string | null> {
  const session = await signInProfessionalUser();
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
      throw (
        rpc.error ??
        new Error(
          rpc.data?.error ??
            rpc.data?.data?.error ??
            "Falha ao criar perfil profissional.",
        )
      );
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
        service_radius_km: 7,
        service_areas: ["Nordeste de Amaralina", "Santa Cruz"],
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
        service_radius_km: 7,
        service_areas: ["Nordeste de Amaralina", "Santa Cruz"],
        available_hours: {
          segunda: "08:00-18:00",
          terca: "08:00-18:00",
        },
      })
      .eq("id", professionalDataId);
  }

  await client.auth.signOut();
  return professionalDataId;
}

async function createLeadFixture(
  professionalDataId: string,
): Promise<LeadFixture | null> {
  const requesterSession = await signInTestUser();
  if (!requesterSession) return null;
  const { client: requesterClient, userId: requesterUserId } = requesterSession;

  const requesterProfileId =
    await getOperationalActiveProfileId(requesterClient);

  const professionalData = await requesterClient
    .from("professional_data")
    .select("profile_id")
    .eq("id", professionalDataId)
    .limit(1)
    .maybeSingle();
  const professionalProfileId = professionalData.data?.profile_id ?? null;
  if (!professionalProfileId) {
    await requesterClient.auth.signOut();
    return null;
  }

  const token = Date.now().toString().slice(-6);
  const leadInsert = await requesterClient
    .from("professional_leads")
    .insert({
      professional_id: professionalDataId,
      requester_user_id: requesterUserId,
      requester_profile_id: requesterProfileId,
      requester_name: "Cliente E2E",
      requester_phone: "71999999999",
      service_needed: `Servico E2E ${token}`,
      description:
        "Fluxo E2E profissional: lead, proposta, aceite, atendimento e avaliacao.",
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
    await requesterClient.auth.signOut();
    throw new Error(
      `Nao foi possivel criar o lead E2E: ${leadInsert.error?.message ?? "resposta vazia"}`,
    );
  }

  const fixture = { leadId, professionalProfileId, requesterProfileId };
  CREATED_FIXTURES.push(fixture);

  const messageInsert = await requesterClient
    .from("professional_lead_messages")
    .insert({
      lead_id: leadId,
      sender_user_id: requesterUserId,
      sender_role: "requester",
      message: "Mensagem inicial do cliente no fluxo E2E.",
    });
  if (messageInsert.error) {
    await requesterClient.auth.signOut();
    throw new Error(
      `Nao foi possivel criar a mensagem E2E: ${messageInsert.error.message}`,
    );
  }
  await requesterClient.auth.signOut();

  const professionalSession = await signInProfessionalUser();
  if (!professionalSession) return null;
  const { client: professionalClient, userId: professionalUserId } =
    professionalSession;

  const quoteInsert = await professionalClient
    .from("professional_lead_quotes")
    .insert({
      lead_id: leadId,
      professional_user_id: professionalUserId,
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
    await professionalClient.auth.signOut();
    throw new Error(
      `Nao foi possivel criar a proposta E2E: ${quoteInsert.error?.message ?? "resposta vazia"}`,
    );
  }
  await professionalClient.auth.signOut();

  const acceptanceSession = await signInTestUser();
  if (!acceptanceSession) return null;

  const quoteAcceptance = await acceptanceSession.client
    .from("professional_lead_quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId)
    .select("id")
    .single();
  if (quoteAcceptance.error) {
    await acceptanceSession.client.auth.signOut();
    throw new Error(
      `Nao foi possivel aceitar a proposta E2E: ${quoteAcceptance.error.message}`,
    );
  }
  await acceptanceSession.client.auth.signOut();

  const completionSession = await signInProfessionalUser();
  if (!completionSession) return null;

  const engagement = await completionSession.client
    .from("professional_service_engagements")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (!engagement.data?.id) {
    await completionSession.client.auth.signOut();
    throw new Error(
      `Atendimento E2E nao foi criado: ${engagement.error?.message ?? "resposta vazia"}`,
    );
  }

  const completion = await completionSession.client
    .from("professional_service_engagements")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", engagement.data.id)
    .select("id")
    .single();
  await completionSession.client.auth.signOut();
  if (completion.error) {
    throw new Error(
      `Nao foi possivel concluir o atendimento E2E: ${completion.error.message}`,
    );
  }

  return fixture;
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

async function cleanupCreatedFixtures(): Promise<void> {
  if (CREATED_FIXTURES.length === 0 && !PROFESSIONAL_USER_ID) return;

  const admin = createOptionalOperationalAdminClient();
  if (!admin) {
    throw new Error(
      "Service role obrigatoria para limpar fixtures profissionais E2E.",
    );
  }

  for (const fixture of [...CREATED_FIXTURES].reverse()) {
    const reviewDelete = await admin
      .from("reviews")
      .delete()
      .eq("reviewed_profile_id", fixture.professionalProfileId)
      .eq("reviewer_profile_id", fixture.requesterProfileId)
      .eq("review_type", "professional");
    if (reviewDelete.error) {
      throw new Error(
        `Falha ao limpar review E2E: ${reviewDelete.error.message}`,
      );
    }

    const leadDelete = await admin
      .from("professional_leads")
      .delete()
      .eq("id", fixture.leadId);
    if (leadDelete.error) {
      throw new Error(`Falha ao limpar lead E2E: ${leadDelete.error.message}`);
    }
  }

  CREATED_FIXTURES.length = 0;

  if (PROFESSIONAL_USER_ID) {
    await deleteOperationalUserWithOwnedProfiles(admin, PROFESSIONAL_USER_ID);
    PROFESSIONAL_USER_ID = null;
  }
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
    if (PROFESSIONAL_FLOW_ENV_ISSUES.length > 0) return;
    await provisionProfessionalActor();
    PROFESSIONAL_DATA_ID = await ensureProfessionalData();
  });

  test.afterAll(async () => {
    await cleanupCreatedFixtures();
  });

  test("tracking + central profissional render lead/proposal/engagement pipeline", async ({
    page,
  }) => {
    test.skip(
      PROFESSIONAL_FLOW_ENV_ISSUES.length > 0,
      `Ambiente profissional E2E incompleto: ${PROFESSIONAL_FLOW_ENV_ISSUES.join(", ")}.`,
    );

    test.skip(
      !PROFESSIONAL_DATA_ID,
      "Nao foi possivel bootstrapar professional_data para o usuario E2E.",
    );

    const fixture = await createLeadFixture(PROFESSIONAL_DATA_ID!);
    test.skip(!fixture, "Nao foi possivel criar fixture de lead profissional.");
    const { leadId, professionalProfileId, requesterProfileId } = fixture!;
    const reviewToken = `E2E review ${Date.now()}`;

    await loginAsUser(page);

    await open(page, `/servicos/orcamentos/${leadId}`);
    await expect(page.getByText(/propostas recebidas/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/atendimento contratado/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/avaliar atendimento conclu[ií]do/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/conversa do or[cç]amento/i)).toBeVisible({
      timeout: 20_000,
    });
    await page
      .getByPlaceholder(/conte como foi o atendimento/i)
      .fill(reviewToken);
    await page.getByRole("button", { name: /enviar avalia[cç][aã]o/i }).click();
    await expect(page.getByText(/^avalia[cç][aã]o enviada$/i)).toBeVisible({
      timeout: 20_000,
    });

    const verifySession = await signInTestUser();
    test.skip(
      !verifySession,
      "Nao foi possivel iniciar sessao de verificacao para review.",
    );

    await expect
      .poll(
        async () =>
          assertProfessionalReviewPersistedWithSession(
            verifySession!.client,
            requesterProfileId,
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
    await expect
      .poll(() => bodyText(page), { timeout: 60_000 })
      .toMatch(/central|perfil profissional/i);
    await expect
      .poll(
        async () =>
          (await bodyText(page)).toLowerCase().includes("verificando acesso"),
        {
          timeout: 60_000,
        },
      )
      .toBe(false);

    await expect
      .poll(
        async () => {
          const text = comparableText(await bodyText(page));
          const hasOperationalPanel =
            text.includes("operacao profissional") ||
            text.includes("pedidos de orcamento") ||
            text.includes("atendimentos contratados");
          const hasProfessionalEmptyState =
            text.includes("perfil profissional") &&
            text.includes("cadastrar servi");
          return hasOperationalPanel || hasProfessionalEmptyState;
        },
        { timeout: 60_000 },
      )
      .toBe(true);

    const centralText = await bodyText(page);
    const centralTextLower = comparableText(centralText);
    const hasOperationalPanel =
      centralTextLower.includes("operacao profissional") ||
      centralTextLower.includes("pedidos de orcamento") ||
      centralTextLower.includes("atendimentos contratados");
    const hasNoServiceState = centralTextLower.includes(
      "nenhum servico publicado ainda",
    );
    const hasProfessionalEmptyState =
      centralTextLower.includes("perfil profissional") &&
      centralTextLower.includes("cadastrar servi");

    if (hasOperationalPanel && !hasNoServiceState) {
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/pedidos de orcamento/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/atendimentos contratados/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/servico e2e/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/dados operacionais do perfil/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/raio de atendimento/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/(7 km|nao informado)/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/nordeste de amaralina/i);
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/(segunda: 08:00-18:00|nao informado)/i);
    }

    if (hasNoServiceState) {
      await expect
        .poll(async () => comparableText(await bodyText(page)), {
          timeout: 60_000,
        })
        .toMatch(/cadastrar servico/i);
    }

    if (hasProfessionalEmptyState) {
      const registerButton = page.getByRole("button", {
        name: /cadastrar servi[çc]os/i,
      });
      const hasRegisterButton = await registerButton
        .isVisible()
        .catch(() => false);
      if (hasRegisterButton) {
        await registerButton.click();
        await expect(page).toHaveURL(/\/servicos\/cadastrar/i, {
          timeout: 20_000,
        });
      }
    }
  });
});
