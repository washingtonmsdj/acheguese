/**
 * HELPER DE AUTENTICAÇÃO PARA TESTES
 *
 * Fornece funções para autenticar como diferentes atores nos testes.
 */

import { supabase } from '@/integrations/supabase';
import {
  createOperationalAdminClient,
  requireOperationalEnv,
} from './operational-env';

let supabaseAdmin: ReturnType<typeof createOperationalAdminClient> | undefined;

function getSupabaseAdmin() {
  supabaseAdmin ??= createOperationalAdminClient();
  return supabaseAdmin;
}

/**
 * Autentica como um profile específico (motorista ou passageiro)
 */
export async function authenticateAsProfile(profileId: string): Promise<void> {
  // Buscar user_id do profile
  const { data: profile, error: profileError } = await getSupabaseAdmin()
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single();

  if (profileError || !profile?.user_id) {
    throw new Error(`Profile ${profileId} não encontrado ou sem user_id`);
  }

  // Buscar email do usuário
  const { data: { user }, error: userError } = await getSupabaseAdmin().auth.admin.getUserById(profile.user_id);

  if (userError || !user?.email) {
    throw new Error(`User ${profile.user_id} não encontrado ou sem email`);
  }

  const { data: link, error: linkError } = await getSupabaseAdmin().auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  });
  const tokenHash = link.properties?.hashed_token;

  if (linkError || !tokenHash) {
    throw new Error(`Falha ao gerar sessão operacional para ${profileId}: ${linkError?.message ?? 'token ausente'}`);
  }

  await supabase.auth.signOut();
  const { data: session, error: signInError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });

  if (signInError || session.user?.id !== profile.user_id) {
    throw new Error(`Falha ao autenticar o profile ${profileId}: ${signInError?.message ?? 'ator divergente'}`);
  }
}

/**
 * Desloga o usuário atual
 */
/**
 * Autentica somente com a conta administrativa E2E declarada pelo operador.
 */
export async function authenticateAsConfiguredAdminProfile(): Promise<string> {
  const env = requireOperationalEnv({
    requireAdminCredentials: true,
    requireServiceRole: true,
  });

  await supabase.auth.signOut();
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: env.adminEmail,
    password: env.adminPassword,
  });

  if (signInError || !signIn.user) {
    throw new Error(`Falha ao autenticar a conta E2E administrativa: ${signInError?.message ?? 'usuario ausente'}`);
  }

  const { data: adminRole, error: roleError } = await getSupabaseAdmin()
    .from('user_roles')
    .select('user_id')
    .eq('user_id', signIn.user.id)
    .in('role_enum', ['super_admin', 'admin'])
    .eq('is_active', true)
    .is('revoked_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (roleError || !adminRole?.user_id) {
    throw new Error(`A conta E2E declarada nao possui papel administrativo ativo: ${roleError?.message ?? 'papel ausente'}`);
  }

  const { data: adminProfile, error: profileError } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('user_id', adminRole.user_id)
    .limit(1)
    .single();

  if (profileError || !adminProfile?.id) {
    throw new Error(`Admin sem profile associado para testes: ${profileError?.message ?? 'sem profile'}`);
  }

  return adminProfile.id;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
