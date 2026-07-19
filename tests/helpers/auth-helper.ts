/**
 * HELPER DE AUTENTICAÇÃO PARA TESTES
 *
 * Fornece funções para autenticar como diferentes atores nos testes.
 */

import { supabase } from '@/integrations/supabase';
import { createOperationalAdminClient } from './operational-env';

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

  // Resetar senha para garantir que é TestPass123!
  await getSupabaseAdmin().auth.admin.updateUserById(profile.user_id, {
    password: 'TestPass123!',
  });

  // Autenticar no client padrão
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: 'TestPass123!',
  });

  if (signInError) {
    throw new Error(`Falha ao autenticar como ${user.email}: ${signInError.message}`);
  }
}

/**
 * Desloga o usuário atual
 */
/**
 * Autentica como o primeiro profile associado a um admin ativo.
 */
export async function authenticateAsFirstAdminProfile(): Promise<string> {
  const { data: adminRole, error: roleError } = await getSupabaseAdmin()
    .from('user_roles')
    .select('user_id')
    .in('role_enum', ['super_admin', 'admin'])
    .eq('is_active', true)
    .is('revoked_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (roleError || !adminRole?.user_id) {
    throw new Error(`Nenhum admin ativo encontrado para testes: ${roleError?.message ?? 'sem user_id'}`);
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

  await authenticateAsProfile(adminProfile.id);
  return adminProfile.id;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
