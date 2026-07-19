import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseScriptConfig {
  url?: string;
  key?: string;
  serviceRoleKey?: string;
  anonKey?: string;
  envFiles?: string[];
}

export interface SupabaseRuntimeConfig {
  url?: string;
  projectId?: string;
  serviceRoleKey?: string;
  anonKey?: string;
}

export interface SupabaseClientCandidate {
  url: string;
  key: string;
  source: string;
  kind: "admin" | "publishable";
}

export const DEFAULT_SUPABASE_SCRIPT_ENV_FILES: string[];

export function loadSupabaseScriptEnv(envFiles?: string[]): void;

export function getSupabaseClientCandidates(
  envFiles?: string[],
): SupabaseClientCandidate[];

export function createServiceRoleClient(
  config?: SupabaseScriptConfig,
): SupabaseClient;

export function createAnonClient(config?: SupabaseScriptConfig): SupabaseClient;

export function issuePrivateAlphaInvite(
  admin: SupabaseClient,
  email: string,
  note?: string,
): Promise<unknown>;

export function createSupabaseScriptClient(
  config: Pick<SupabaseScriptConfig, "envFiles" | "key" | "url"> & {
    key: string;
    url: string;
  },
): SupabaseClient;

export function getSupabaseConfig(
  config?: Pick<SupabaseScriptConfig, "envFiles">,
): SupabaseRuntimeConfig;
