/**
 * E2E Test Helpers - Education Module
 *
 * Helpers para setup de dados e autenticação nos testes E2E do módulo Education.
 * Qualquer mutação via service role deve permanecer restrita a Business marcado
 * explicitamente como fixture técnica E2E.
 */

import { type Page } from '@playwright/test';
import { createOptionalOperationalAdminClient } from './operational-env';

export const admin = createOptionalOperationalAdminClient();

const TECHNICAL_FIXTURE_SOURCE = 'e2e';
const TECHNICAL_FIXTURE_KIND = 'technical_fixture';

type E2ECredentials = {
  email: string;
  password: string;
};

type TechnicalBusinessRow = {
  id: string;
  profile_id: string;
  metadata: unknown;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getE2ECredentials(): E2ECredentials | null {
  const candidates: Array<[string | undefined, string | undefined]> = [
    [
      process.env.E2E_EDUCATION_OWNER_EMAIL,
      process.env.E2E_EDUCATION_OWNER_PASSWORD,
    ],
    [process.env.E2E_USER_EMAIL, process.env.E2E_USER_PASSWORD],
    [process.env.TEST_DRIVER_EMAIL, process.env.TEST_DRIVER_PASSWORD],
  ];

  for (const [email, password] of candidates) {
    if (email && password) {
      return { email, password };
    }
  }

  return null;
}

function isTechnicalBusinessFixture(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }

  const record = metadata as Record<string, unknown>;
  return (
    record.source === TECHNICAL_FIXTURE_SOURCE &&
    record.source_kind === TECHNICAL_FIXTURE_KIND
  );
}

async function resolveTechnicalBusiness(
  businessIdOrProfileId: string,
): Promise<TechnicalBusinessRow> {
  if (!admin) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY nao configurada para validar provenance E2E.',
    );
  }

  const byProfile = await admin
    .from('business_data')
    .select('id, profile_id, metadata')
    .eq('profile_id', businessIdOrProfileId)
    .maybeSingle();

  if (byProfile.error) {
    throw byProfile.error;
  }

  let business = byProfile.data as TechnicalBusinessRow | null;

  if (!business) {
    const byId = await admin
      .from('business_data')
      .select('id, profile_id, metadata')
      .eq('id', businessIdOrProfileId)
      .maybeSingle();

    if (byId.error) {
      throw byId.error;
    }

    business = byId.data as TechnicalBusinessRow | null;
  }

  if (!business) {
    throw new Error(`Business E2E ${businessIdOrProfileId} nao encontrado.`);
  }

  if (!isTechnicalBusinessFixture(business.metadata)) {
    throw new Error(
      `Refusing Education E2E mutation for ${businessIdOrProfileId}: ` +
        'business_data is not marked source=e2e/source_kind=technical_fixture.',
    );
  }

  return business;
}

async function findAuthUserByEmail(email: string) {
  if (!admin) return null;

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

/**
 * Faz login via UI somente com um par de credenciais E2E explicitamente
 * configurado. Nunca descobre senha nem altera credenciais no banco.
 */
export async function loginViaUI(page: Page): Promise<boolean> {
  const credentials = getE2ECredentials();
  if (!credentials) {
    return false;
  }

  await page.goto('/login');
  await page.locator('#login-identifier').fill(credentials.email);
  await page.locator('#login-password').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  const success = await page
    .waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (success) await page.waitForTimeout(2000);
  return success;
}

/**
 * Autentica a credencial E2E configurada e, quando o admin client existe,
 * comprova que ela administra o Business técnico solicitado.
 *
 * Não é permitido resetar senha de owner/admin descoberto no banco.
 */
export async function authenticateAsBusinessOwner(
  page: Page,
  businessId: string,
): Promise<void> {
  const credentials = getE2ECredentials();
  if (!credentials) {
    throw new Error(
      'Autenticacao E2E nao configurada. Defina E2E_EDUCATION_OWNER_EMAIL/' +
        'E2E_EDUCATION_OWNER_PASSWORD, E2E_USER_EMAIL/E2E_USER_PASSWORD ou ' +
        'TEST_DRIVER_EMAIL/TEST_DRIVER_PASSWORD.',
    );
  }

  if (admin) {
    const business = await resolveTechnicalBusiness(businessId);
    const user = await findAuthUserByEmail(credentials.email);

    if (!user) {
      throw new Error(
        `Usuario E2E configurado ${credentials.email} nao existe no alvo aprovado.`,
      );
    }

    const membership = await admin
      .from('profile_members')
      .select('user_id, role')
      .eq('profile_id', business.profile_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .maybeSingle();

    if (membership.error) {
      throw membership.error;
    }

    if (!membership.data) {
      throw new Error(
        `Usuario E2E ${credentials.email} nao e owner/admin do Business tecnico ${business.profile_id}.`,
      );
    }
  }

  const ok = await loginViaUI(page);
  if (!ok) {
    throw new Error('Login UI com a credencial E2E configurada falhou.');
  }
}

/**
 * Garante que um perfil Education existe apenas para Business com provenance
 * técnica E2E.
 */
export async function ensureEducationProfileExists(
  businessIdOrProfileId: string,
): Promise<string | null> {
  if (!admin) return null;

  const business = await resolveTechnicalBusiness(businessIdOrProfileId);

  const existing = await admin
    .from('education_profiles')
    .select('id')
    .eq('business_id', business.profile_id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) return existing.data.id;

  const { data: profile, error } = await admin
    .from('education_profiles')
    .insert({
      business_id: business.profile_id,
      institution_type: 'school',
      niche_key: 'regular_school',
      status: 'published',
    })
    .select('id')
    .single();

  if (error || !profile) {
    console.warn(`Nao foi possivel criar education profile: ${error?.message}`);
    return null;
  }

  return profile.id;
}

/** Cria um programa de teste para uma instituicao tecnica E2E. */
export async function createTestProgram(
  businessIdOrProfileId: string,
  overrides?: Partial<{
    name: string;
    description: string;
    age_range: string;
    shift: string;
    modality: string;
    available_spots: number;
    price: number;
  }>,
): Promise<string | null> {
  if (!admin) return null;

  const profileId = await ensureEducationProfileExists(businessIdOrProfileId);
  if (!profileId) return null;

  const { data: program, error } = await admin
    .from('education_programs')
    .insert({
      education_profile_id: profileId,
      name: overrides?.name ?? 'Programa de Teste',
      description: overrides?.description ?? 'Descricao do programa de teste',
      age_group: overrides?.age_range ?? '6-10 anos',
      shift: overrides?.shift ?? 'Manha',
      modality: overrides?.modality ?? 'Presencial',
      available_slots: overrides?.available_spots ?? 30,
      price_from: overrides?.price ?? 1500,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !program) {
    console.warn(`Nao foi possivel criar programa: ${error?.message}`);
    return null;
  }

  return program.id;
}

/** Cria um lead de teste para uma instituicao tecnica E2E. */
export async function createTestLead(
  businessIdOrProfileId: string,
  overrides?: Partial<{
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    child_name: string;
    child_age: number;
    status: string;
  }>,
): Promise<string | null> {
  if (!admin) return null;

  const profileId = await ensureEducationProfileExists(businessIdOrProfileId);
  if (!profileId) return null;

  const { data: lead, error } = await admin
    .from('education_leads')
    .insert({
      education_profile_id: profileId,
      full_name: overrides?.parent_name ?? 'Maria Silva',
      email: overrides?.parent_email ?? 'maria.silva@example.com',
      phone: overrides?.parent_phone ?? '+5571999887766',
      child_name: overrides?.child_name ?? 'Joao Silva',
      child_age: overrides?.child_age ?? 8,
      status: overrides?.status ?? 'new',
      source_channel: 'website',
    })
    .select('id')
    .single();

  if (error || !lead) {
    console.warn(`Nao foi possivel criar lead: ${error?.message}`);
    return null;
  }

  return lead.id;
}

/** Cria um evento de teste para uma instituicao tecnica E2E. */
export async function createTestEvent(
  businessIdOrProfileId: string,
  overrides?: Partial<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    is_public: boolean;
  }>,
): Promise<string | null> {
  if (!admin) return null;

  const profileId = await ensureEducationProfileExists(businessIdOrProfileId);
  if (!profileId) return null;

  const startDate =
    overrides?.start_date ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate =
    overrides?.end_date ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString();

  const { data: event, error } = await admin
    .from('education_events')
    .insert({
      education_profile_id: profileId,
      title: overrides?.title ?? 'Evento de Teste',
      description: overrides?.description ?? 'Descricao do evento de teste',
      start_date: startDate,
      end_date: endDate,
      location: overrides?.location ?? 'Auditorio Principal',
      is_public: overrides?.is_public ?? true,
    })
    .select('id')
    .single();

  if (error || !event) {
    console.warn(`Nao foi possivel criar evento: ${error?.message}`);
    return null;
  }

  return event.id;
}

/** Publica somente o Education profile de um Business tecnico E2E. */
export async function publishEducationProfile(
  businessIdOrProfileId: string,
): Promise<void> {
  if (!admin) return;

  const business = await resolveTechnicalBusiness(businessIdOrProfileId);
  const result = await admin
    .from('education_profiles')
    .update({ status: 'published' })
    .eq('business_id', business.profile_id);

  if (result.error) throw result.error;
}

/**
 * Limpa apenas dados de teste de uma instituicao tecnica E2E.
 * O education_profile e preservado como fixture base.
 */
export async function cleanupEducationData(
  businessIdOrProfileId: string,
): Promise<void> {
  if (!admin) return;

  const business = await resolveTechnicalBusiness(businessIdOrProfileId);
  const profile = await admin
    .from('education_profiles')
    .select('id')
    .eq('business_id', business.profile_id)
    .maybeSingle();

  if (profile.error) throw profile.error;
  if (!profile.data) return;

  await admin
    .from('education_lead_events')
    .delete()
    .eq('education_profile_id', profile.data.id);
  await admin
    .from('education_leads')
    .delete()
    .eq('education_profile_id', profile.data.id);
  await admin
    .from('education_events')
    .delete()
    .eq('education_profile_id', profile.data.id);
  await admin
    .from('education_programs')
    .delete()
    .eq('education_profile_id', profile.data.id);
}

export function hasAdminClient(): boolean {
  return admin !== null;
}

export function hasE2ECredentials(): boolean {
  return getE2ECredentials() !== null;
}

/**
 * Navega para uma URL do dashboard e aguarda o conteudo carregar.
 */
export async function waitForDashboard(
  page: Page,
  url: string,
): Promise<boolean> {
  const businessSegment = url.split('/education')[0];

  const currentUrl = page.url();
  if (!currentUrl.includes('/perfil') && !currentUrl.includes('/empresas')) {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
  }

  await page.waitForTimeout(4000);

  const currentUrlAfter = page.url();
  if (!currentUrlAfter.includes(businessSegment + '/education')) {
    await page.waitForTimeout(2000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }

  const finalUrl = page.url();
  const isOnDashboard = finalUrl.includes(businessSegment + '/education');
  const hasContent = await page
    .locator('body')
    .evaluate((el) => (el.textContent ?? '').trim().length > 20)
    .catch(() => false);

  console.log(
    `waitForDashboard: url=${finalUrl}, onDashboard=${isOnDashboard}, hasContent=${hasContent}`,
  );
  return hasContent;
}
