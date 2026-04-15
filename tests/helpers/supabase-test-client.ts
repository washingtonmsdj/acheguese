/**
 * HELPER: SUPABASE CLIENT PARA TESTES
 * 
 * Fornece o client service_role para operações de sistema/dispatch nos testes.
 */

import { createClient } from '@supabase/supabase-js';

let _adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Retorna o client Supabase com service_role para testes
 */
export function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return _adminClient;
}

/**
 * Wrapper para operações de dispatch que precisam de service_role
 */
export async function withAdminClient<T>(
  operation: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  const client = getAdminClient();
  return operation(client);
}
