/**
 * Cliente Supabase - Configuração Principal
 *
 * Este arquivo configura o cliente Supabase usando APENAS variáveis de ambiente.
 *
 * IMPORTANTE:
 * - Nunca hardcode credenciais aqui
 * - Sempre use variáveis de ambiente do .env.local para produção
 * - Este cliente usa a chave pública (anon key) para operações do frontend
 *
 * @see .env.local para configuração das variáveis
 */
import { logger } from '@/shared/utils/logger';
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated";
import { createSecureStorage } from "./cookieStorage";
// Validar variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";
const DEBUG_BOOT = import.meta.env.DEV && import.meta.env.VITE_DEBUG_BOOT === "true";
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  logger.warn(
    "⚠️ Variáveis de ambiente do Supabase não configuradas. " +
    "Usando placeholders — funcionalidades de backend não estarão disponíveis."
  );
}

// Limpa tokens expirados da URL
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  if (url.hash.includes('access_token') || url.searchParams.has('code')) {
    // Remove fragmentos de auth da URL após 5s (tempo para o SDK processar)
    setTimeout(() => {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.hash = '';
      cleanUrl.searchParams.delete('code');
      window.history.replaceState({}, document.title, cleanUrl.toString());
    }, 5000);
  }
}

// Log de inicialização (apenas em desenvolvimento)
if (DEBUG_BOOT) {
  console.debug("[Supabase] initialized", {
    url: import.meta.env.VITE_SUPABASE_URL,
  });
}

/**
 * Cliente Supabase principal
 * 
 * ✅ SEGURO: Usa cookies seguros ao invés de localStorage
 * 
 * STORAGE:
 * - Produção: Cookies com Secure + SameSite=Strict
 * - Desenvolvimento: Híbrido (cookies preferencial, localStorage fallback)
 * - Migração automática de localStorage para cookies
 * 
 * SEGURANÇA:
 * - Proteção contra XSS (cookies não acessíveis via JavaScript quando HttpOnly)
 * - Proteção contra CSRF (SameSite=Strict)
 * - Transmissão segura (Secure flag em HTTPS)
 * 
 * Tipado com Database gerado automaticamente do schema do Supabase.
 */
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? createSecureStorage() : undefined,
      storageKey: 'token',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
);
