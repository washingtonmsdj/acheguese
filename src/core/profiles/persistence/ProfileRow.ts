/**
 * ProfileRow — Representação do Banco (snake_case)
 * 
 * Re-export direto do types.generated.
 * NUNCA modificar manualmente — regenerar com `supabase gen types typescript`.
 * 
 * @version 2.0.0
 */

import type { Database } from '@/integrations/supabase';

/**
 * ProfileRow — Row do banco (snake_case)
 */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * ProfileInsert — Insert do banco
 */
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

/**
 * ProfileUpdate — Update do banco
 */
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
