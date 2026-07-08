import { expect, test, type Page } from '@playwright/test';
import {
  createOperationalAnonClient,
  createOptionalOperationalAdminClient,
  getMissingOperationalEnv,
  getOperationalEnv,
  type OperationalSupabaseClient,
} from '../../helpers/operational-env';

const TEST_EMAIL = process.env.E2E_USER_EMAIL || '';
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || '';

const E2E_PROFILE_USERNAME = 'e2e-education-school';
const E2E_BUSINESS_NAME = 'E2E Educacao Instituto';

type EducationProfileRow = {
  institution_type: string;
  niche_key: string;
  summary: string | null;
  whatsapp_number: string | null;
  school_type: string | null;
  school_network: string | null;
  school_inep_code: string | null;
  school_source_url: string | null;
  education_levels: string[] | null;
  shifts: string[] | null;
  age_range_min: number | null;
  age_range_max: number | null;
  enrollment_open: boolean | null;
  school_basic_resources: string[] | null;
  school_accessibility_features: string[] | null;
  school_equipment_features: string[] | null;
  school_facility_features: string[] | null;
};

let admin: OperationalSupabaseClient | null = null;
let businessProfileId: string | null = null;
let businessRouteBase: string | null = null;
let authSessionPayload: unknown = null;

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

function requiredEnvAvailable(): boolean {
  return (
    Boolean(TEST_EMAIL && TEST_PASSWORD) &&
    getMissingOperationalEnv({ requireServiceRole: true }).length === 0
  );
}

async function ensureEducationBusiness(): Promise<string> {
  if (!requiredEnvAvailable()) {
    throw new Error('Credenciais E2E/Supabase ausentes.');
  }

  admin = createOptionalOperationalAdminClient();
  if (!admin) {
    throw new Error('Cliente administrativo Supabase indisponivel para setup Education E2E.');
  }

  const authClient = createOperationalAnonClient();

  const signIn = await authClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signIn.error || !signIn.data.user) {
    throw new Error(`Login E2E falhou: ${signIn.error?.message ?? 'usuario ausente'}`);
  }

  const userId = signIn.data.user.id;
  authSessionPayload = signIn.data.session;

  let profile = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_type', 'business')
    .eq('username', E2E_PROFILE_USERNAME)
    .maybeSingle();

  if (!profile.data?.id) {
    profile = await admin
      .from('profiles')
      .insert({
        user_id: userId,
        profile_type: 'business',
        name: E2E_BUSINESS_NAME,
        display_name: E2E_BUSINESS_NAME,
        username: E2E_PROFILE_USERNAME,
        slug: E2E_PROFILE_USERNAME,
        bio: 'Perfil E2E para validar cadastro de educacao.',
        is_active: true,
      })
      .select('id')
      .single();
  }

  if (profile.error || !profile.data?.id) {
    throw new Error(`Nao foi possivel criar profile E2E: ${profile.error?.message ?? 'sem id'}`);
  }

  const profileId = profile.data.id as string;

  await admin.from('profile_members').upsert(
    {
      profile_id: profileId,
      user_id: userId,
      role: 'owner',
    },
    { onConflict: 'profile_id,user_id' },
  );

  const location = await admin
    .from('locations')
    .select('id')
    .eq('geographic_path', '/br/ba/salvador/nordeste-de-amaralina')
    .maybeSingle();

  const existingBusiness = await admin
    .from('business_data')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  const businessPayload = {
    business_name: E2E_BUSINESS_NAME,
    description: 'Instituicao E2E para validacao automatizada do modulo de educacao.',
    slug: E2E_PROFILE_USERNAME,
    category: 'educacao',
    subcategory: 'educacao',
    status: 'active',
    business_role: 'standalone',
    is_verified: true,
    location_id: location.data?.id ?? null,
  };

  if (existingBusiness.data?.id) {
    await admin.from('business_data').update(businessPayload).eq('id', existingBusiness.data.id);
  } else {
    await admin.from('business_data').insert({
      profile_id: profileId,
      ...businessPayload,
    });
  }

  await authClient.auth.signOut();
  return profileId;
}

async function resetEducationProfile(): Promise<void> {
  if (!admin || !businessProfileId) return;

  const { data: profiles } = await admin
    .from('education_profiles')
    .select('id')
    .eq('business_id', businessProfileId);

  const ids = (profiles ?? []).map((profile) => profile.id);
  if (ids.length === 0) return;

  await admin.from('education_lead_events').delete().in('education_profile_id', ids);
  await admin.from('education_leads').delete().in('education_profile_id', ids);
  await admin.from('education_events').delete().in('education_profile_id', ids);
  await admin.from('education_programs').delete().in('education_profile_id', ids);
  await admin.from('education_profiles').delete().in('id', ids);
}

async function getEducationProfile(): Promise<EducationProfileRow> {
  if (!admin || !businessProfileId) {
    throw new Error('Fixture E2E nao inicializada.');
  }

  const { data, error } = await admin
    .from('education_profiles')
    .select(
      [
        'institution_type',
        'niche_key',
        'summary',
        'whatsapp_number',
        'school_type',
        'school_network',
        'school_inep_code',
        'school_source_url',
        'education_levels',
        'shifts',
        'age_range_min',
        'age_range_max',
        'enrollment_open',
        'school_basic_resources',
        'school_accessibility_features',
        'school_equipment_features',
        'school_facility_features',
      ].join(','),
    )
    .eq('business_id', businessProfileId)
    .single();

  if (error || !data) {
    throw new Error(`Perfil education nao encontrado: ${error?.message ?? 'sem dados'}`);
  }

  return data as unknown as EducationProfileRow;
}

async function waitForEducationProfile(): Promise<EducationProfileRow> {
  const startedAt = Date.now();
  let lastError: unknown = null;

  while (Date.now() - startedAt < 30_000) {
    try {
      return await getEducationProfile();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Perfil education nao foi persistido.');
}

async function injectAuthSession(page: Page): Promise<void> {
  if (!authSessionPayload) throw new Error('Sessao E2E ausente.');

  const supabaseUrl = getOperationalEnv().supabaseUrl;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL ausente para injetar sessao E2E.');
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const authStorageKey = `sb-${projectRef}-auth-token`;
  await page.addInitScript(
    ({ key, session }) => {
      for (const storageKey of Object.keys(window.localStorage)) {
        if (storageKey.startsWith('sb-') && storageKey.endsWith('-auth-token')) {
          window.localStorage.removeItem(storageKey);
        }
      }
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: authStorageKey, session: authSessionPayload },
  );
}

async function loginIfNeeded(page: Page, returnPath: string): Promise<void> {
  const loginVisible = await page
    .locator('#login-identifier')
    .waitFor({ state: 'visible', timeout: 75_000 })
    .then(() => true)
    .catch(() => false);

  if (!loginVisible) return;

  await page.locator('#login-identifier').fill(TEST_EMAIL);
  await page.locator('#login-password').fill(TEST_PASSWORD);
  const acceptCookies = page.getByRole('button', { name: /aceitar todos|aceitar/i });
  if (await acceptCookies.isVisible().catch(() => false)) {
    await acceptCookies.click().catch(() => undefined);
  }
  await page.getByRole('button', { name: /^Entrar$/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith('/central'), { timeout: 30_000 });
  await page.goto(returnPath, { waitUntil: 'domcontentloaded', timeout: 60_000 });
}

async function openSetup(page: Page): Promise<void> {
  if (!businessProfileId) throw new Error('businessProfileId ausente.');

  await injectAuthSession(page);

  await page.goto('/central/empresas', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const businessAlreadyVisible = await page
    .getByText(E2E_BUSINESS_NAME)
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (!businessAlreadyVisible) {
    await loginIfNeeded(page, '/central/empresas');
  }
  await expect(page.getByText(E2E_BUSINESS_NAME)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Gerenciar empresa' }).first().click();
  await page.waitForURL((url) => /^\/central\/empresas\/[^/]+\/?$/.test(url.pathname), {
    timeout: 30_000,
  });
  businessRouteBase = new URL(page.url()).pathname.replace(/\/$/, '');

  await page.goto(`${businessRouteBase}/education/setup`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByTestId('education-setup-form')).toBeVisible({ timeout: 20_000 });
}

async function selectRadixOption(page: Page, triggerTestId: string, optionName: string): Promise<void> {
  await page.getByTestId(triggerTestId).click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

test.beforeAll(async () => {
  test.skip(!requiredEnvAvailable(), 'Credenciais E2E/Supabase ausentes.');
  businessProfileId = await ensureEducationBusiness();
});

test.beforeEach(async () => {
  await resetEducationProfile();
});

test.afterAll(async () => {
  await resetEducationProfile();
});

test.describe('Education Setup Flow', () => {
  test('abre cadastro base contextualizado para educacao sem escolha manual de categoria', async ({ page }) => {
    await page.goto('/central/empresas/nova/educacao', {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await loginIfNeeded(page, '/central/empresas/nova/educacao');

    await expect(page.getByRole('heading', { name: 'Cadastrar instituicao de ensino' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('business-create-category')).toHaveValue('educacao');
    await expect(page.getByTestId('business-create-category')).toBeDisabled();
    await expect(page.getByTestId('business-create-name')).toHaveAttribute(
      'placeholder',
      'Ex: Escola Municipal Maria Quiteria',
    );
  });

  test('cadastra escola regular com dados oficiais, oferta e infraestrutura', async ({ page }) => {
    await openSetup(page);

    await selectRadixOption(page, 'education-institution-type-trigger', 'Escola');
    await selectRadixOption(page, 'education-niche-trigger', 'Escola Regular');
    await selectRadixOption(page, 'education-school-type-trigger', 'Privada');
    await selectRadixOption(page, 'education-school-network-trigger', 'Privada');

    await page.getByTestId('education-school-inep').fill('12345678');
    await page.getByTestId('education-school-source-url').fill('https://educacao.example/e2e');
    await page.getByLabel('Ensino Fundamental - Anos Iniciais').check();
    await page.getByLabel('Manha').check();
    await page.getByTestId('education-age-min').fill('6');
    await page.getByTestId('education-age-max').fill('14');
    await page.getByLabel('Matricula aberta').check();
    await page.getByRole('button', { name: 'Escola basica' }).click();
    await page
      .getByTestId('education-summary')
      .fill('Cadastro E2E de escola regular com dados oficiais e infraestrutura.');
    await page.getByTestId('education-whatsapp').fill('+5571999999999');

    const saveButton = page.getByTestId('education-save-setup');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    const profile = await waitForEducationProfile();
    expect(profile.institution_type).toBe('school');
    expect(profile.niche_key).toBe('regular_school');
    expect(profile.school_type).toBe('private');
    expect(profile.school_network).toBe('private');
    expect(profile.school_inep_code).toBe('12345678');
    expect(profile.education_levels).toContain('elementary_1');
    expect(profile.shifts).toContain('morning');
    expect(profile.age_range_min).toBe(6);
    expect(profile.age_range_max).toBe(14);
    expect(profile.enrollment_open).toBe(true);
    expect(profile.school_basic_resources).toContain('water_supply');
    expect(profile.school_facility_features).toContain('library');
  });

  test('cadastra nicho nao-escolar sem carregar campos legados de escola', async ({ page }) => {
    await openSetup(page);

    await selectRadixOption(page, 'education-institution-type-trigger', 'Escola de Idiomas');
    await selectRadixOption(page, 'education-niche-trigger', 'Escola de Idiomas');

    await expect(page.getByTestId('education-school-inep')).toHaveCount(0);
    await page.getByLabel('Noite').check();
    await page.getByTestId('education-age-min').fill('12');
    await page.getByTestId('education-age-max').fill('99');
    await page
      .getByTestId('education-summary')
      .fill('Cadastro E2E de escola de idiomas com cursos livres e atendimento recorrente.');
    await page.getByTestId('education-whatsapp').fill('+5571888888888');

    const saveButton = page.getByTestId('education-save-setup');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    const profile = await waitForEducationProfile();
    expect(profile.institution_type).toBe('language_school');
    expect(profile.niche_key).toBe('language_school');
    expect(profile.school_type).toBeNull();
    expect(profile.school_network).toBeNull();
    expect(profile.school_inep_code).toBeNull();
    expect(profile.shifts).toContain('evening');
    expect(profile.age_range_min).toBe(12);
    expect(profile.age_range_max).toBe(99);
  });
});
