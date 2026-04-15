/**
 * Detecção de Ambiente
 * Determina se está rodando em desenvolvimento (Lovable) ou produção (Supabase Produção)
 */

export const ENVIRONMENT = (import.meta.env.VITE_ENVIRONMENT || 'development') as 'development' | 'production';
export const IS_PRODUCTION = ENVIRONMENT === 'production';
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

// Validar configuração
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error('[Environment] Supabase credentials not configured');
}

// Log de inicialização
console.log(`[Environment] Running in ${ENVIRONMENT} mode`);
console.log(`[Environment] Supabase URL: ${SUPABASE_CONFIG.url?.split('.')[0]}...`);

export const getEnvironmentLabel = (): string => {
  if (IS_PRODUCTION) return '🔴 PRODUÇÃO';
  if (IS_DEVELOPMENT) return '🟢 DESENVOLVIMENTO';
  return '⚪ DESCONHECIDO';
};
