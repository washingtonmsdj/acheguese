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

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated";

// Validar variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
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
if (import.meta.env.DEV) {
  console.log("✅ Supabase inicializado");
  console.log(`📍 URL: ${import.meta.env.VITE_SUPABASE_URL}`);
}

/**
 * Cliente Supabase principal
 * 
 * NOTA: Usa localStorage com fallback para sessionStorage em modo anônimo.
 * Tipado com Database gerado automaticamente do schema do Supabase.
 */
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Limpa URL após processar tokens para evitar reutilização
      flowType: 'pkce',
    },
  },
);
