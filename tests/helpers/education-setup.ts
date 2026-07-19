/**
 * E2E Test Helpers - Education Module
 *
 * Helpers para setup de dados e autenticação nos testes E2E do módulo Education.
 * Usa SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY (fallback).
 */

import { type Page } from '@playwright/test';
import { createOptionalOperationalAdminClient } from './operational-env';

export const admin = createOptionalOperationalAdminClient();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Faz login via UI com as credenciais E2E configuradas.
 * Usa E2E_EDUCATION_OWNER_EMAIL ou E2E_USER_EMAIL do ambiente.
 */
export async function loginViaUI(page: Page): Promise<boolean> {
  const email =
    process.env.E2E_EDUCATION_OWNER_EMAIL ||
    process.env.E2E_USER_EMAIL ||
    process.env.TEST_DRIVER_EMAIL;
  const password =
    process.env.E2E_EDUCATION_OWNER_PASSWORD ||
    process.env.E2E_USER_PASSWORD ||
    process.env.TEST_DRIVER_PASSWORD;

  if (!email || !password) {
    return false;
  }

  // Login via UI com as credenciais E2E
  await page.goto('/login');
  await page.locator('#login-identifier').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  const success = await page
    .waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  // Aguardar o SessionService terminar de carregar
  if (success) await page.waitForTimeout(2000);

  return success;
}

/**
 * Autentica como dono de um business específico.
 * Se o admin client não estiver disponível, tenta login via UI com credenciais E2E.
 */
export async function authenticateAsBusinessOwner(page: Page, businessId: string): Promise<void> {
  if (!admin) {
    // Fallback: login via UI com credenciais E2E
    const ok = await loginViaUI(page);
    if (!ok) {
      throw new Error(
        'Autenticação falhou. Configure SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) ' +
          'e E2E_USER_EMAIL/E2E_USER_PASSWORD no .env.local'
      );
    }
    return;
  }

  // Buscar o profile_id do business
  // O businessId pode ser o profile_id diretamente (como usado nas URLs do dashboard)
  // ou o business_data.id
  let profileId: string;
  
  // Verificar se é um profile_id direto (business_data usa profile_id na URL)
  const { data: bizByProfileId } = await admin
    .from('business_data')
    .select('profile_id')
    .eq('profile_id', businessId)
    .maybeSingle();

  if (bizByProfileId) {
    profileId = businessId; // já é o profile_id
  } else {
    // Tentar como business_data.id
    const { data: business, error: businessError } = await admin
      .from('business_data')
      .select('profile_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      const ok = await loginViaUI(page);
      if (!ok) {
        throw new Error(`Business ${businessId} não encontrado e login via UI falhou`);
      }
      return;
    }
    profileId = business.profile_id;
  }

  // Buscar um membro owner/admin do profile
  const { data: member } = await admin
    .from('profile_members')
    .select('user_id')
    .eq('profile_id', profileId)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single();

  if (!member) {
    const ok = await loginViaUI(page);
    if (!ok) {
      throw new Error(`Nenhum owner/admin encontrado para business ${businessId}`);
    }
    return;
  }

  // Buscar email do usuário
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(member.user_id);

  if (!user?.email) {
    const ok = await loginViaUI(page);
    if (!ok) {
      throw new Error(`User ${member.user_id} não encontrado ou sem email`);
    }
    return;
  }

  // Usar senha E2E se for o usuário E2E, senão resetar para TestPass123!
  const e2eEmail = process.env.E2E_USER_EMAIL || process.env.TEST_DRIVER_EMAIL;
  const e2ePassword = process.env.E2E_USER_PASSWORD || process.env.TEST_DRIVER_PASSWORD;
  
  let loginPassword: string;
  if (user.email === e2eEmail && e2ePassword) {
    // Tentar com senha E2E primeiro, mas garantir que funciona resetando
    await admin.auth.admin.updateUserById(member.user_id, { password: e2ePassword });
    loginPassword = e2ePassword;
  } else {
    // Resetar senha para padrão de teste
    await admin.auth.admin.updateUserById(member.user_id, { password: 'TestPass123!' });
    loginPassword = 'TestPass123!';
  }

  // Login via UI
  await page.goto('/login');
  await page.locator('#login-identifier').fill(user.email);
  await page.locator('#login-password').fill(loginPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Aguardar redirecionamento após login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });

  // Aguardar o SessionService terminar de carregar os perfis
  // Isso evita o "Failed to fetch" que acontece quando navegamos muito rápido
  await page.waitForTimeout(2000);
}

/**
 * Garante que um perfil de educação existe para o business.
 * O businessId deve ser o profile_id (usado nas URLs do dashboard).
 * Retorna o ID do education_profile.
 */
export async function ensureEducationProfileExists(businessIdOrProfileId: string): Promise<string | null> {
  if (!admin) return null;

  // O education_profiles.business_id referencia profiles(id) = profile_id
  // Verificar se já existe com o profile_id direto
  const { data: existing } = await admin
    .from('education_profiles')
    .select('id')
    .eq('business_id', businessIdOrProfileId)
    .maybeSingle();

  if (existing) return existing.id;

  // Tentar como business_data.id (resolver para profile_id)
  const { data: bizData } = await admin
    .from('business_data')
    .select('profile_id')
    .eq('id', businessIdOrProfileId)
    .maybeSingle();

  const profileId = bizData?.profile_id || businessIdOrProfileId;

  // Criar perfil básico
  const { data: profile, error } = await admin
    .from('education_profiles')
    .insert({
      business_id: profileId,
      institution_type: 'school',
      niche_key: 'regular_school',
      status: 'published',
    })
    .select('id')
    .single();

  if (error || !profile) {
    console.warn(`Não foi possível criar education profile: ${error?.message}`);
    return null;
  }

  return profile.id;
}

/**
 * Resolve o business_data.id a partir de um profile_id ou business_data.id.
 * @deprecated Use profile_id diretamente
 */
async function resolveBusinessDataId(idOrProfileId: string): Promise<string | null> {
  if (!admin) return null;

  // Tentar como business_data.id direto
  const { data: direct } = await admin
    .from('business_data')
    .select('id')
    .eq('id', idOrProfileId)
    .maybeSingle();

  if (direct) return direct.id;

  // Tentar como profile_id
  const { data: byProfile } = await admin
    .from('business_data')
    .select('id')
    .eq('profile_id', idOrProfileId)
    .maybeSingle();

  return byProfile?.id || null;
}

/**
 * Cria um programa de teste para uma instituição.
 */
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
  }>
): Promise<string | null> {
  if (!admin) return null;

  const profileId = await ensureEducationProfileExists(businessIdOrProfileId);
  if (!profileId) return null;

  const { data: program, error } = await admin
    .from('education_programs')
    .insert({
      education_profile_id: profileId,
      name: overrides?.name ?? 'Programa de Teste',
      description: overrides?.description ?? 'Descrição do programa de teste',
      age_group: overrides?.age_range ?? '6-10 anos',
      shift: overrides?.shift ?? 'Manhã',
      modality: overrides?.modality ?? 'Presencial',
      available_slots: overrides?.available_spots ?? 30,
      price_from: overrides?.price ?? 1500,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !program) {
    console.warn(`Não foi possível criar programa: ${error?.message}`);
    return null;
  }

  return program.id;
}

/**
 * Cria um lead de teste para uma instituição.
 */
export async function createTestLead(
  businessIdOrProfileId: string,
  overrides?: Partial<{
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    child_name: string;
    child_age: number;
    status: string;
  }>
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
      child_name: overrides?.child_name ?? 'João Silva',
      child_age: overrides?.child_age ?? 8,
      status: overrides?.status ?? 'new',
      source_channel: 'website',
    })
    .select('id')
    .single();

  if (error || !lead) {
    console.warn(`Não foi possível criar lead: ${error?.message}`);
    return null;
  }

  return lead.id;
}

/**
 * Cria um evento de teste para uma instituição.
 */
export async function createTestEvent(
  businessIdOrProfileId: string,
  overrides?: Partial<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    is_public: boolean;
  }>
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
      description: overrides?.description ?? 'Descrição do evento de teste',
      start_date: startDate,
      end_date: endDate,
      location: overrides?.location ?? 'Auditório Principal',
      is_public: overrides?.is_public ?? true,
    })
    .select('id')
    .single();

  if (error || !event) {
    console.warn(`Não foi possível criar evento: ${error?.message}`);
    return null;
  }

  return event.id;
}

/**
 * Publica o perfil de educação (muda status para published).
 */
export async function publishEducationProfile(businessIdOrProfileId: string): Promise<void> {
  if (!admin) return;

  // Tentar como profile_id direto
  await admin
    .from('education_profiles')
    .update({ status: 'published' })
    .eq('business_id', businessIdOrProfileId);
}

/**
 * Limpa todos os dados de teste de uma instituição.
 * NÃO deleta o education_profile — apenas os dados criados nos testes.
 */
export async function cleanupEducationData(businessIdOrProfileId: string): Promise<void> {
  if (!admin) return;

  // Tentar como profile_id direto
  const { data: profile } = await admin
    .from('education_profiles')
    .select('id')
    .eq('business_id', businessIdOrProfileId)
    .maybeSingle();

  if (!profile) return;

  // Deletar apenas dados de teste (não o perfil em si)
  await admin.from('education_lead_events').delete().eq('education_profile_id', profile.id);
  await admin.from('education_leads').delete().eq('education_profile_id', profile.id);
  await admin.from('education_events').delete().eq('education_profile_id', profile.id);
  await admin.from('education_programs').delete().eq('education_profile_id', profile.id);
  // NÃO deletar o education_profile — ele é necessário para os testes
}

/**
 * Verifica se o admin client está disponível.
 */
export function hasAdminClient(): boolean {
  return admin !== null;
}

/**
 * Verifica se há credenciais E2E configuradas.
 */
export function hasE2ECredentials(): boolean {
  return !!(
    (process.env.E2E_EDUCATION_OWNER_EMAIL ||
      process.env.E2E_USER_EMAIL ||
      process.env.TEST_DRIVER_EMAIL) &&
    (process.env.E2E_EDUCATION_OWNER_PASSWORD ||
      process.env.E2E_USER_PASSWORD ||
      process.env.TEST_DRIVER_PASSWORD)
  );
}

/**
 * Navega para uma URL do dashboard e aguarda o conteúdo carregar.
 * Aguarda o SessionService terminar de carregar antes de navegar.
 */
export async function waitForDashboard(page: Page, url: string): Promise<boolean> {
  const businessSegment = url.split('/education')[0];

  // Primeiro navegar para /perfil para garantir que o SessionService carregou
  // Isso evita o "Failed to fetch" que acontece quando navegamos muito rápido após o login
  const currentUrl = page.url();
  if (!currentUrl.includes('/perfil') && !currentUrl.includes('/empresas')) {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  // Navegar para a URL do dashboard
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Fechar banner de cookies se existir
  const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
  }

  // Aguardar estabilização
  await page.waitForTimeout(4000);

  // Se foi redirecionado, tentar novamente
  const currentUrlAfter = page.url();
  if (!currentUrlAfter.includes(businessSegment + '/education')) {
    await page.waitForTimeout(2000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }

  const finalUrl = page.url();
  const isOnDashboard = finalUrl.includes(businessSegment + '/education');
  const hasContent = await page.locator('body').evaluate(
    (el) => (el.textContent ?? '').trim().length > 20
  ).catch(() => false);

  console.log(`waitForDashboard: url=${finalUrl}, onDashboard=${isOnDashboard}, hasContent=${hasContent}`);
  return hasContent;
}
