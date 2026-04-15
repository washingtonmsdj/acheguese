/**
 * Supabase Integration Module
 *
 * Exporta apenas a API pública do módulo de integração com Supabase.
 * Inclui cliente principal e cliente admin.
 */

// Cliente principal
export { supabase } from "./supabase";

// Cliente admin
export { supabaseAdmin, getSupabaseAdmin } from "./supabaseAdmin";

// Re-export createClient e tipos do supabase-js para uso em services
export { createClient } from "@supabase/supabase-js";
export type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

// Re-export tipos do cliente gerado
export * from "./types";
