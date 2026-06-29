import { expect, test, type Page } from '@playwright/test';
import { createClient, type User } from '@supabase/supabase-js';
import { login, loginAsUser } from '../../e2e/helpers/auth';
import {
  expectPausedLaunchSurface,
  openPublicRoute,
} from './support/publicRouteAssertions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

interface CommunicationE2EFixture {
  email: string;
  password: string;
  userId: string;
  profileId: string;
  channelId: string;
  locationId: string;
}

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function findUserByEmail(email: string): Promise<User | null> {
  if (!admin) return null;

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const found = data.users.find((user) => user.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;

    page += 1;
  }
}

async function cleanupUserByEmail(email: string): Promise<void> {
  if (!admin) return;

  const user = await findUserByEmail(email);
  if (!user) return;

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw error;
}

async function waitForPersonalProfile(userId: string): Promise<string> {
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada.');

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('profile_type', 'personal')
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return data.id as string;

    await delay(500);
  }

  throw new Error(`Perfil pessoal nao encontrado para usuario ${userId}.`);
}

async function resolvePilotLocationId(): Promise<string | null> {
  if (!admin) return null;

  const slugs = ['nordeste-de-amaralina', 'vale-das-pedrinhas', 'santa-cruz', 'chapada-do-rio-vermelho'];
  const { data, error } = await admin
    .from('locations')
    .select('id,slug,status')
    .in('slug', slugs)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

async function createCommunicationFixture(): Promise<CommunicationE2EFixture | null> {
  if (!admin) return null;

  try {
    const suffix = uniqueSuffix();
    const email = `e2e-communication-${suffix}@example.com`;
    const password = 'CommunicationE2E@2026!';

    await cleanupUserByEmail(email);

    const createUserResult = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'E2E Communication Operator' },
    });
    if (createUserResult.error || !createUserResult.data.user) return null;

    const userId = createUserResult.data.user.id;
    const profileId = await waitForPersonalProfile(userId);
    const locationId = await resolvePilotLocationId();
    if (!locationId) {
      await cleanupUserByEmail(email);
      return null;
    }

    const channelSlug = `canal-e2e-${suffix}`;
    const createChannelResult = await admin
      .from('communication_channels')
      .insert({
        profile_id: profileId,
        public_name: `Canal E2E ${suffix}`,
        slug: channelSlug,
        channel_kind: 'portal',
        description: 'Canal fixture E2E para validacao deterministica de comunicacao territorial.',
        status: 'active',
        verification_status: 'verified',
        reliability_score: 85,
      })
      .select('id')
      .single();

    if (createChannelResult.error || !createChannelResult.data?.id) {
      await cleanupUserByEmail(email);
      return null;
    }

    const channelId = createChannelResult.data.id as string;

    const membershipResult = await admin.from('profile_members').upsert(
      {
        profile_id: profileId,
        user_id: userId,
        role: 'owner',
      },
      { onConflict: 'profile_id,user_id' },
    );
    if (membershipResult.error) {
      await cleanupUserByEmail(email);
      return null;
    }

    const territoryResult = await admin.from('communication_channel_territories').upsert(
      {
        channel_id: channelId,
        location_id: locationId,
        territory_role: 'primary',
        can_publish: true,
        can_alert: false,
        can_push: false,
        approved_by_user_id: userId,
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'channel_id,location_id' },
    );
    if (territoryResult.error) {
      await cleanupUserByEmail(email);
      return null;
    }

    return { email, password, userId, profileId, channelId, locationId };
  } catch {
    return null;
  }
}

async function mockCommunicationDistribution(page: Page) {
  const now = '2026-05-15T12:00:00.000Z';

  await page.route('**/rest/v1/communication_publication_distribution**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'distribution-article',
          publication_id: 'publication-article',
          channel_id: 'channel-local',
          location_id: 'location-test',
          target_type: 'community_tab',
          is_active: true,
          relevance_score: 80,
          rank_score: 90,
          rank_reason: 'territorial:community_tab:news:article:trusted_source',
          created_at: now,
          updated_at: now,
        },
        {
          id: 'distribution-update',
          publication_id: 'publication-update',
          channel_id: 'channel-local',
          location_id: 'location-test',
          target_type: 'community_tab',
          is_active: true,
          relevance_score: 70,
          rank_score: 75,
          rank_reason: 'territorial:community_tab:public_utility:update:trusted_source',
          created_at: now,
          updated_at: now,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/communication_publications**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'publication-article',
          channel_id: 'channel-local',
          author_profile_id: 'profile-local',
          location_id: 'location-test',
          publication_type: 'news',
          content_format: 'article',
          title: 'Materia transacional do bairro',
          summary: 'Resumo da materia que deve abrir a pagina canonica do canal.',
          body: 'Conteudo completo da materia territorial criada para validar distribuicao.',
          source_url: null,
          media: {},
          status: 'published',
          trust_label: 'verified_source',
          published_at: now,
          expires_at: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'publication-update',
          channel_id: 'channel-local',
          author_profile_id: 'profile-local',
          location_id: 'location-test',
          publication_type: 'public_utility',
          content_format: 'update',
          title: 'Postagem simples da radio',
          summary: 'Resumo curto da postagem simples.',
          body: 'Texto inline da postagem simples que deve permanecer no contexto da comunidade.',
          source_url: null,
          media: {},
          status: 'published',
          trust_label: 'verified_source',
          published_at: now,
          expires_at: null,
          created_at: now,
          updated_at: now,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/communication_channels**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'channel-local',
          profile_id: 'profile-local',
          public_name: 'Radio Comunitaria Local',
          legal_name: null,
          slug: 'radio-comunitaria-local',
          channel_kind: 'radio',
          description: 'Canal comunitario local usado em teste de distribuicao.',
          website_url: null,
          contact_email: null,
          contact_phone: null,
          status: 'active',
          verification_status: 'verified',
          reliability_score: 82,
          alert_cooldown_until: null,
          created_at: now,
          updated_at: now,
        },
      ]),
    });
  });

  await page.route('**/rest/v1/locations**', async (route) => {
    if (!route.request().url().includes('location-test')) {
      await route.continue();
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'location-test',
          name: 'Complexo do Nordeste de Amaralina',
          full_name: 'Complexo do Nordeste de Amaralina, Salvador',
          slug: 'complexo-do-nordeste-de-amaralina',
          type: 'district',
          parent_id: null,
        },
      ]),
    });
  });
}

test.describe('communication territorial routes', () => {
  test.setTimeout(240_000);
  let realFixture: CommunicationE2EFixture | null = null;

  test.beforeAll(async () => {
    realFixture = await createCommunicationFixture();
  });

  test.afterAll(async () => {
    if (realFixture?.email) {
      await cleanupUserByEmail(realFixture.email);
    }
  });

  test('public communication landing and request surfaces are paused', async ({ page }) => {
    await expectPausedLaunchSurface(page, '/comunicacao');
    await expectPausedLaunchSurface(page, '/comunicacao/solicitar');
  });

  test('city and channel public communication surfaces are paused', async ({ page }) => {
    await expectPausedLaunchSurface(page, '/comunicacao/ba/salvador');
    await expectPausedLaunchSurface(page, '/comunicacao/ba/salvador/canal-demo');
  });

  test('admin and central communication routes are stable', async ({ page }) => {
    await openPublicRoute(page, '/admin/comunicacao', { waitUntil: 'domcontentloaded', dismissConsent: true });
    await expect(page).toHaveURL(/\/admin\/comunicacao|\/login|\/auth/i);

    await openPublicRoute(page, '/central/comunicacao', { waitUntil: 'domcontentloaded', dismissConsent: true });
    await expect(page).toHaveURL(/\/central\/comunicacao|\/login|\/auth/i);
  });

  test('community communication surface stays paused inside the territorial shell', async ({ page }) => {
    await expectPausedLaunchSurface(page, '/comunidade/ba/salvador/comunicacao');
  });

  test('community communication surface ignores distribution payloads while launch scope is paused', async ({ page }) => {
    await mockCommunicationDistribution(page);
    await expectPausedLaunchSurface(page, '/comunidade/ba/salvador/comunicacao');

    await expect(page.getByText('Materia transacional do bairro')).toHaveCount(0);
    await expect(page.getByText('Postagem simples da radio')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Ler no canal/i })).toHaveCount(0);
  });

  test('authenticated operator publishes a real post in central communication workspace', async ({ page }) => {
    const uniqueTitle = `E2E Comunicacao Real ${Date.now()}`;

    if (realFixture?.email && realFixture.password) {
      await login(page, realFixture.email, realFixture.password);
    } else {
      await loginAsUser(page);
    }

    await openPublicRoute(page, '/central/comunicacao', { waitUntil: 'domcontentloaded', dismissConsent: true });

    const noManagedChannel = await page
      .getByText(/Voce ainda nao opera nenhum canal ativo aprovado/i)
      .isVisible()
      .catch(() => false);
    test.skip(
      noManagedChannel,
      'Sem fixture de canal ativa no ambiente atual (ou sem SUPABASE_SERVICE_ROLE_KEY para criar fixture).',
    );

    const operateButton = page.getByRole('button', { name: /Operar este canal/i }).first();
    const hasOperableChannel = await operateButton.isVisible().catch(() => false);
    test.skip(!hasOperableChannel, 'Canal fixture nao ficou operavel em /central/comunicacao.');
    await operateButton.click();

    const territoryTrigger = page.locator('form button[role="combobox"]').nth(1);
    await expect(territoryTrigger).toBeVisible({ timeout: 20_000 });
    await territoryTrigger.click();

    const pilotTerritoryOption = page
      .getByRole('option')
      .filter({ hasText: /Complexo do Nordeste de Amaralina/i })
      .first();
    const hasPilotTerritory = await pilotTerritoryOption.isVisible().catch(() => false);
    test.skip(!hasPilotTerritory, 'Canal sem territorio autorizado no piloto do Complexo do Nordeste de Amaralina.');
    await pilotTerritoryOption.click();

    const publicationTypeTrigger = page.locator('form button[role="combobox"]').nth(2);
    await publicationTypeTrigger.click();
    await page.getByRole('option', { name: /Noticia/i }).first().click();

    const formatTrigger = page.locator('form button[role="combobox"]').nth(3);
    await formatTrigger.click();
    await page.getByRole('option', { name: /Postagem simples/i }).first().click();

    await page.locator('#title').fill(uniqueTitle);
    await page.locator('#summary').fill('Publicacao E2E real para validar o workspace central sem mock.');
    await page.locator('#body').fill('Conteudo publicado via central para validar criacao e publicacao operacionais.');

    const publishToggle = page.locator('label:has-text("Publicar agora") input[type="checkbox"]');
    const isChecked = await publishToggle.isChecked().catch(() => false);
    if (!isChecked) await publishToggle.check();

    await page.getByRole('button', { name: /Criar e publicar/i }).click();
    await expect(page.getByText(/Publicacao criada e publicada/i)).toBeVisible({ timeout: 30_000 });
  });
});
