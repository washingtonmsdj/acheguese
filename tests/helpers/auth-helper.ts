/**
 * HELPER DE AUTENTICAÇÃO PARA TESTES
 * 
 * Fornece funções para autenticar como diferentes atores nos testes.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Autentica como um profile específico (motorista ou passageiro)
 */
export async function authenticateAsProfile(profileId: string): Promise<void> {
  // Buscar user_id do profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single();
  
  if (profileError || !profile?.user_id) {
    throw new Error(`Profile ${profileId} não encontrado ou sem user_id`);
  }
  
  // Buscar email do usuário
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
  
  if (userError || !user?.email) {
    throw new Error(`User ${profile.user_id} não encontrado ou sem email`);
  }
  
  // Resetar senha para garantir que é TestPass123!
  await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
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
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
