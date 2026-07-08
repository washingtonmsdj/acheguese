/**
 * Supabase Integration Module
 *
 * Exporta apenas a API pública do módulo de integração com Supabase.
 * 
 * ✅ SEGURANÇA: supabaseAdmin foi removido - use edge functions para operações admin
 */

// Cliente principal
export { supabase } from "./supabase";

// Tipos publicos do supabase-js usados pelos services.
export type {
  AuthChangeEvent,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";

// Re-export tipos canônicos do schema
export * from "./types.generated";

// Helpers tipados de query/RPC
export * from "./services/supabaseHelpers";
