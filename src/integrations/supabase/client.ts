// Re-exporta o singleton do cliente principal.
// Este arquivo existe por compatibilidade com imports legados e código gerado.
// NÃO cria uma nova instância — usa o singleton de supabase.ts.
export { supabase } from "./supabase";
export type { Database } from "./types.generated";
