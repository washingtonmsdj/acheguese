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
import { createBrowserAuthStorage } from "./cookieStorage";
import { AUTH_STORAGE_KEY } from "@/config/security.config";
import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;
const nodeEnv = typeof process !== "undefined" ? process.env : undefined;
const DEBUG_BOOT =
  (viteEnv?.DEV ?? nodeEnv?.NODE_ENV !== "production") &&
  (viteEnv?.VITE_DEBUG_BOOT === "true" || nodeEnv?.VITE_DEBUG_BOOT === "true");

function hasAuthReturnParams(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.hash.includes("access_token") || url.searchParams.has("code");
}

function cleanAuthReturnUrl(): void {
  if (typeof window === "undefined") return;
  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = "";
  cleanUrl.searchParams.delete("code");
  window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}`);
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
 * - Cookie-only browser storage with Secure on HTTPS + SameSite=Strict
 * - No auth token fallback to localStorage
 * - Oversized Supabase payloads are chunked within the security SSOT budget
 *
 * Seguranca:
 * - PKCE auth flow avoids access tokens in URL fragments
 * - XSS controls are CSP, sanitization, validation, and no localStorage token copy
 * - CSRF reduction via SameSite=Strict
 * - Transmissao segura (Secure flag em HTTPS)
 *
 * Tipado com Database gerado automaticamente do schema do Supabase.
 */
export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_CONFIG.url,
  PUBLIC_SUPABASE_CONFIG.publishableKey,
  {
    auth: {
      storage: typeof window !== "undefined" ? createBrowserAuthStorage() : undefined,
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);

if (hasAuthReturnParams()) {
  void supabase.auth.getSession().finally(() => {
    cleanAuthReturnUrl();
  });
}
