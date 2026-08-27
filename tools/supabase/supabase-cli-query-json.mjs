import { parseSupabaseCliJsonValues } from "./supabase-cli-json.mjs";

export function parseSupabaseQueryRows(output) {
  for (const parsed of parseSupabaseCliJsonValues(output)) {
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.rows)) return parsed.rows;
  }

  throw new Error("Supabase CLI JSON does not contain rows.");
}
