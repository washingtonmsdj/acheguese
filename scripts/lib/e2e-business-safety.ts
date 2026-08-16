import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCTION_HOSTS = new Set(["acheguese.com.br", "www.acheguese.com.br"]);
const SUPABASE_HOST_SUFFIX = ".supabase.co";
const LINKED_PROJECT_CONFIG = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../supabase/config.toml",
);

function cleanEnv(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/^[\'\"]|[\'\"]$/g, "");
  return cleaned || undefined;
}

function isProductionUrl(value: string | undefined): boolean {
  if (!value) return false;

  try {
    return PRODUCTION_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function getLinkedProductionProjectRef(): string | null {
  try {
    const config = readFileSync(LINKED_PROJECT_CONFIG, "utf8");
    return config.match(/^project_id\s*=\s*["']([^"']+)["']/m)?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function getSupabaseProjectRef(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    if (!hostname.endsWith(SUPABASE_HOST_SUFFIX)) return null;

    const projectRef = hostname.slice(0, -SUPABASE_HOST_SUFFIX.length);
    return projectRef || null;
  } catch {
    return null;
  }
}

function getTargetSupabaseUrl(): string | undefined {
  return cleanEnv(process.env.SUPABASE_URL) ?? cleanEnv(process.env.VITE_SUPABASE_URL);
}

export function hasIsolatedBusinessMutationTarget(): boolean {
  const target = process.env.E2E_BUSINESS_TARGET?.trim().toLowerCase();
  const approved = process.env.E2E_BUSINESS_MUTATION_APPROVED === "true";

  if (!approved || target !== "isolated") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (isProductionUrl(process.env.PLAYWRIGHT_BASE_URL)) return false;
  if (isProductionUrl(process.env.VITE_PUBLIC_APP_URL)) return false;

  const linkedProductionProjectRef = getLinkedProductionProjectRef();
  const targetProjectRef = getSupabaseProjectRef(getTargetSupabaseUrl());

  // Fail closed: Business E2E mutations require a remote Supabase target whose
  // project ref can be proven different from the repository-linked Production project.
  if (!linkedProductionProjectRef || !targetProjectRef) return false;
  if (targetProjectRef === linkedProductionProjectRef) return false;

  return true;
}

export function assertIsolatedBusinessMutationTarget(operation: string): void {
  if (hasIsolatedBusinessMutationTarget()) return;

  throw new Error(
    `${operation} bloqueada: fixtures de business exigem ` +
      `E2E_BUSINESS_TARGET=isolated e E2E_BUSINESS_MUTATION_APPROVED=true, ` +
      `uma URL Supabase remota comprovadamente diferente do projeto Production ` +
      `vinculado em supabase/config.toml e um app alvo fora de Production.`,
  );
}

export function technicalBusinessMetadata(): Record<string, string> {
  return {
    source: "e2e",
    source_kind: "technical_fixture",
  };
}
