/**
 * SUPABASE ADMIN CLIENT
 *
 * Cliente Supabase com service_role key para operacoes administrativas
 *
 * ATENCAO: Este cliente tem permissoes totais!
 * - Contorna RLS (Row Level Security)
 * - Acessa auth.users
 * - Pode modificar qualquer dado
 *
 * USO: Apenas em hooks/services admin
 * A service_role key DEVE ser configurada via variavel de ambiente.
 *
 * IMPORTANTE:
 * - Nunca exponha a service_role key no frontend
 * - Use apenas em operacoes administrativas
 * - Configure como variavel de ambiente secreta em producao
 *
 * @version 2.1.0
 */

import { createClient } from "@supabase/supabase-js";

// Validar variaveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "VITE_SUPABASE_URL nao esta definida. " +
      "Funcionalidades de backend nao estarao disponiveis.",
  );
}

// Log de aviso se service_role key nao estiver configurada
if (!SUPABASE_SERVICE_ROLE_KEY && import.meta.env.DEV) {
  console.info(
    "SUPABASE_SERVICE_ROLE_KEY ausente no frontend (esperado). " +
      "Operacoes administrativas sensiveis devem usar Edge Functions/Backend.",
  );
}

/**
 * Cliente Supabase com service_role
 *
 * CUIDADO: Tem permissoes totais!
 * Requer SUPABASE_SERVICE_ROLE_KEY configurada como secret
 */
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'sb-admin-auth-token',
      },
    })
  : null;

// Log de inicializacao (apenas em desenvolvimento)
if (import.meta.env.DEV && supabaseAdmin) {
  console.log("Supabase Admin inicializado (service_role)");
}

/**
 * Helper seguro para obter o admin client
 * Lanca erro se nao configurado
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "supabaseAdmin nao esta disponivel. " +
        "Use Edge Functions/Backend ou carregue SUPABASE_SERVICE_ROLE_KEY apenas no shell administrativo",
    );
  }
  return supabaseAdmin;
}
