import { getRecordValue } from "@/shared/utils/recordLookup";

type PublicRuntimeEnv = Partial<Record<string, string>>;

const viteEnv = ((import.meta as ImportMeta & { env?: PublicRuntimeEnv }).env ?? {}) as PublicRuntimeEnv;
const nodeEnv =
  typeof process !== "undefined"
    ? ((process.env ?? {}) as PublicRuntimeEnv)
    : {};

function requirePublicRuntimeEnv(name: string): string {
  const value = getRecordValue(viteEnv, name) ?? getRecordValue(nodeEnv, name);
  if (typeof value === "string" && value.trim().length > 0) {
    const trimmed = value.trim();
    if (/your[-_]|placeholder|publishable_key|anon_key|example/i.test(trimmed)) {
      throw new Error(`[PublicSupabase] Variavel de ambiente contem placeholder: ${name}`);
    }

    return trimmed;
  }

  throw new Error(`[PublicSupabase] Variavel de ambiente obrigatoria ausente: ${name}`);
}

export const PUBLIC_SUPABASE_CONFIG = {
  url: requirePublicRuntimeEnv("VITE_SUPABASE_URL").replace(/\/+$/, ""),
  publishableKey: requirePublicRuntimeEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
} as const;

export type SupabaseFunctionName =
  | "admin-suspend-profile"
  | "admin-verify-profile"
  | "health-check"
  | "nominatim-proxy"
  | "user-delete-account"
  | "user-export-data";

export function buildSupabaseFunctionUrl(functionName: SupabaseFunctionName): string {
  return `${PUBLIC_SUPABASE_CONFIG.url}/functions/v1/${functionName}`;
}
