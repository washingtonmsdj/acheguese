/**
 * SUPABASE ADMIN CLIENT
 *
 * SECURITY NOTE:
 * - service_role nunca pode ir para bundle de frontend
 * - este cliente so pode existir em contexto server/edge
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const DEBUG_BOOT = import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true";
const IS_BROWSER = typeof window !== "undefined";

const exposedServiceRole = (import.meta.env as Record<string, string | undefined>)
  .VITE_SUPABASE_SERVICE_ROLE_KEY;

if (exposedServiceRole) {
  throw new Error(
    "SECURITY: VITE_SUPABASE_SERVICE_ROLE_KEY nao pode ser usado. " +
      "Use apenas SUPABASE_SERVICE_ROLE_KEY em ambiente server/edge.",
  );
}

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "VITE_SUPABASE_URL nao esta definida. Funcionalidades de backend nao estarao disponiveis.",
  );
}

const runtimeProcessEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;
const SUPABASE_SERVICE_ROLE_KEY = !IS_BROWSER
  ? runtimeProcessEnv?.SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  : undefined;

if (!SUPABASE_SERVICE_ROLE_KEY && DEBUG_BOOT) {
  console.debug(
    "SUPABASE_SERVICE_ROLE_KEY ausente no runtime server (esperado no frontend). " +
      "Operacoes administrativas sensiveis devem usar Edge Functions/Backend.",
  );
}

/**
 * Cliente Supabase com service_role
 *
 * Em browser, e sempre null por seguranca.
 */
export const supabaseAdmin = !IS_BROWSER && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: "sb-admin-auth-token",
      },
    })
  : null;

if (DEBUG_BOOT && supabaseAdmin) {
  console.debug("Supabase Admin inicializado (server-only service_role)");
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "supabaseAdmin nao esta disponivel neste runtime. " +
        "Use Edge Functions/Backend para operacoes com service_role.",
    );
  }
  return supabaseAdmin;
}

