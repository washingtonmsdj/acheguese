/**
 * Cliente Supabase - Configuracao Principal
 *
 * Este arquivo configura o cliente Supabase usando APENAS variaveis de ambiente.
 *
 * IMPORTANTE:
 * - Nunca hardcode credenciais aqui
 * - Sempre use variaveis de ambiente do .env.local para producao
 * - Este cliente usa a chave publica (anon key) para operacoes do frontend
 *
 * @see .env.local para configuracao das variaveis
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated";
import { createSecureStorage } from "./cookieStorage";
import { AUTH_STORAGE_KEY } from "@/config/security.config";
import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const nodeEnv = typeof process !== "undefined" ? process.env : undefined;
const DEBUG_BOOT =
  (viteEnv?.DEV ?? nodeEnv?.NODE_ENV !== "production") &&
  (viteEnv?.VITE_DEBUG_BOOT === "true" || nodeEnv?.VITE_DEBUG_BOOT === "true");

// Limpa tokens expirados da URL
if (typeof window !== "undefined") {
  const url = new URL(window.location.href);
  if (url.hash.includes("access_token") || url.searchParams.has("code")) {
    // Remove fragmentos de auth da URL apos 5s (tempo para o SDK processar)
    setTimeout(() => {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.hash = "";
      cleanUrl.searchParams.delete("code");
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }, 5000);
  }
}

// Log de inicializacao (apenas em desenvolvimento)
if (DEBUG_BOOT) {
  console.debug("[Supabase] initialized", {
    url: PUBLIC_SUPABASE_CONFIG.url,
  });
}

/**
 * Cliente Supabase principal
 *
 * STORAGE:
 * - Producao: Cookies com Secure + SameSite=Strict
 * - Desenvolvimento: Hibrido (cookies preferencial, localStorage fallback)
 * - Migracao automatica de localStorage para cookies
 *
 * Seguranca:
 * - Protecao contra XSS (cookies nao acessiveis via JavaScript quando HttpOnly)
 * - Protecao contra CSRF (SameSite=Strict)
 * - Transmissao segura (Secure flag em HTTPS)
 *
 * Tipado com Database gerado automaticamente do schema do Supabase.
 */
export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_CONFIG.url,
  PUBLIC_SUPABASE_CONFIG.publishableKey,
  {
    auth: {
      storage: typeof window !== "undefined" ? createSecureStorage() : undefined,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  },
);
