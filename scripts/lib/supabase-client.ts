import {
  createAnonClient as createAnonClientImpl,
  createServiceRoleClient as createServiceRoleClientImpl,
  createSupabaseScriptClient as createSupabaseScriptClientImpl,
  getSupabaseClientCandidates as getSupabaseClientCandidatesImpl,
  getSupabaseConfig as getSupabaseConfigImpl,
  issuePrivateAlphaInvite as issuePrivateAlphaInviteImpl,
  loadSupabaseScriptEnv as loadSupabaseScriptEnvImpl,
} from "./supabase-client.mjs";

export interface SupabaseConfig {
  url?: string;
  serviceRoleKey?: string;
  anonKey?: string;
  envFiles?: string[];
}

export interface SupabaseClientCandidate {
  url: string;
  key: string;
  source: string;
  kind: "admin" | "publishable";
}

export interface SupabaseScriptClientConfig {
  url: string;
  key: string;
  envFiles?: string[];
}

export function loadSupabaseScriptEnv(envFiles?: string[]): void {
  loadSupabaseScriptEnvImpl(envFiles);
}

export function getSupabaseClientCandidates(
  envFiles?: string[],
): SupabaseClientCandidate[] {
  return getSupabaseClientCandidatesImpl(envFiles);
}

export function createServiceRoleClient(config: SupabaseConfig = {}) {
  return createServiceRoleClientImpl(config);
}

export function createAnonClient(config: SupabaseConfig = {}) {
  return createAnonClientImpl(config);
}

export function issuePrivateAlphaInvite(
  admin: ReturnType<typeof createServiceRoleClientImpl>,
  email: string,
  note?: string,
) {
  return issuePrivateAlphaInviteImpl(admin, email, note);
}

export function createSupabaseScriptClient(config: SupabaseScriptClientConfig) {
  return createSupabaseScriptClientImpl(config);
}

export function getSupabaseConfig(
  config: Pick<SupabaseConfig, "envFiles"> = {},
) {
  return getSupabaseConfigImpl(config);
}
