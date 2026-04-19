/**
 * Supabase Integration Module
 *
 * Exporta apenas a API pública do módulo de integração com Supabase.
 * 
 * ✅ SEGURANÇA: supabaseAdmin foi removido - use edge functions para operações admin
 */

// Cliente principal
export { supabase } from "./supabase";

// Re-export createClient e tipos do supabase-js para uso em services
export { createClient } from "@supabase/supabase-js";
export type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

// Re-export tipos do cliente gerado
export * from "./types";
