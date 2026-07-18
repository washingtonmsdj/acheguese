import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type OperationalSupabaseClient = SupabaseClient<any, "public", any>;
type OperationalSuite = () => void;
type DescribeLike = {
  (name: string, suite: OperationalSuite): void;
  skip: (name: string, suite: OperationalSuite) => void;
};
type OperationalClientKind = "anon" | "admin";

export interface OperationalEnvRequirements {
  requireAdminCredentials?: boolean;
  requireAnonKey?: boolean;
  requireDriverCredentials?: boolean;
  requireServiceRole?: boolean;
}

export interface OperationalEnv {
  adminEmail?: string;
  adminPassword?: string;
  anonKey?: string;
  confirmation?: string;
  driverEmail?: string;
  driverPassword?: string;
  projectRef?: string;
  serviceRoleKey?: string;
  supabaseUrl?: string;
  target?: string;
}

export const OPERATIONAL_TEST_CONFIRMATION = "NON_PRODUCTION_REMOTE_CONFIRMED";
const REMOTE_TARGETS = new Set(["development", "staging"]);

const ENV_LABELS: Record<keyof OperationalEnv, string> = {
  adminEmail: "E2E_ADMIN_EMAIL",
  adminPassword: "E2E_ADMIN_PASSWORD",
  anonKey: "VITE_SUPABASE_PUBLISHABLE_KEY",
  confirmation: `OPERATIONAL_TEST_CONFIRM=${OPERATIONAL_TEST_CONFIRMATION}`,
  driverEmail: "E2E_USER_EMAIL or TEST_DRIVER_EMAIL",
  driverPassword: "E2E_USER_PASSWORD or TEST_DRIVER_PASSWORD",
  projectRef: "OPERATIONAL_TEST_PROJECT_REF",
  serviceRoleKey: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
  supabaseUrl: "VITE_SUPABASE_URL",
  target: "OPERATIONAL_TEST_TARGET (development, staging or local)",
};
let operationalClientSequence = 0;

function readEnv(key: string): string | undefined {
  const viteEnv = (
    import.meta as ImportMeta & { env?: Record<string, string | undefined> }
  ).env;
  return process.env[key] || viteEnv?.[key];
}

function createOperationalClient(
  supabaseUrl: string,
  supabaseKey: string,
  kind: OperationalClientKind,
): OperationalSupabaseClient {
  operationalClientSequence += 1;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: `achegue-operational-${kind}-${operationalClientSequence}`,
    },
  });
}

export function getOperationalEnv(): OperationalEnv {
  return {
    adminEmail: readEnv("E2E_ADMIN_EMAIL"),
    adminPassword: readEnv("E2E_ADMIN_PASSWORD"),
    anonKey:
      readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
      readEnv("VITE_SUPABASE_ANON_KEY"),
    confirmation: readEnv("OPERATIONAL_TEST_CONFIRM"),
    driverEmail: readEnv("E2E_USER_EMAIL") || readEnv("TEST_DRIVER_EMAIL"),
    driverPassword:
      readEnv("E2E_USER_PASSWORD") || readEnv("TEST_DRIVER_PASSWORD"),
    projectRef: readEnv("OPERATIONAL_TEST_PROJECT_REF"),
    serviceRoleKey:
      readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SUPABASE_SECRET_KEY"),
    supabaseUrl: readEnv("VITE_SUPABASE_URL"),
    target: readEnv("OPERATIONAL_TEST_TARGET"),
  };
}

export function getOperationalTargetIssues(env: OperationalEnv): string[] {
  const issues: string[] = [];
  const target = env.target?.trim().toLowerCase();
  let url: URL | null = null;

  if (!target || (!REMOTE_TARGETS.has(target) && target !== "local")) {
    issues.push(ENV_LABELS.target);
  }

  if (!env.supabaseUrl) {
    issues.push(ENV_LABELS.supabaseUrl);
  } else {
    try {
      url = new URL(env.supabaseUrl);
    } catch {
      issues.push("VITE_SUPABASE_URL must be a valid URL");
    }
  }

  if (target === "local" && url) {
    const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
    if (!localHosts.has(url.hostname)) {
      issues.push(
        "OPERATIONAL_TEST_TARGET=local requires a loopback Supabase URL",
      );
    }
  }

  if (target && REMOTE_TARGETS.has(target)) {
    if (env.confirmation !== OPERATIONAL_TEST_CONFIRMATION) {
      issues.push(ENV_LABELS.confirmation);
    }
    if (!env.projectRef) {
      issues.push(ENV_LABELS.projectRef);
    }
    if (
      url &&
      (url.protocol !== "https:" ||
        url.hostname !== `${env.projectRef}.supabase.co`)
    ) {
      issues.push(
        "VITE_SUPABASE_URL must match the explicitly declared non-production project ref",
      );
    }
  }

  return [...new Set(issues)];
}

export function getMissingOperationalEnv(
  requirements: OperationalEnvRequirements = {},
): string[] {
  const env = getOperationalEnv();
  const missing: (keyof OperationalEnv)[] = [];

  const targetIssues = getOperationalTargetIssues(env);

  if (!env.supabaseUrl) missing.push("supabaseUrl");
  if (requirements.requireAnonKey !== false && !env.anonKey)
    missing.push("anonKey");
  if (requirements.requireServiceRole && !env.serviceRoleKey)
    missing.push("serviceRoleKey");
  if (requirements.requireDriverCredentials) {
    if (!env.driverEmail) missing.push("driverEmail");
    if (!env.driverPassword) missing.push("driverPassword");
  }

  if (requirements.requireAdminCredentials) {
    if (!env.adminEmail) missing.push("adminEmail");
    if (!env.adminPassword) missing.push("adminPassword");
  }

  return [...targetIssues, ...missing.map((key) => ENV_LABELS[key])];
}

export function assertOperationalTargetAuthorized(): void {
  const issues = getOperationalTargetIssues(getOperationalEnv());
  if (issues.length > 0) {
    throw new Error(
      `Operational test target is not authorized. Missing or invalid: ${issues.join(", ")}.`,
    );
  }
}

export function requireOperationalEnv(
  requirements: OperationalEnvRequirements = {},
): Required<OperationalEnv> {
  const missing = getMissingOperationalEnv(requirements);
  if (missing.length > 0) {
    throw new Error(
      `Operational test environment is incomplete. Missing: ${missing.join(", ")}.`,
    );
  }

  return getOperationalEnv() as Required<OperationalEnv>;
}

export function describeOperational(
  name: string,
  requirements: OperationalEnvRequirements,
  suite: OperationalSuite,
): void {
  const describe = (
    globalThis as typeof globalThis & { describe?: DescribeLike }
  ).describe;
  if (!describe) {
    throw new Error(
      "describeOperational requires a test runner with global describe support.",
    );
  }

  const missing = getMissingOperationalEnv(requirements);
  const describeFn = missing.length > 0 ? describe.skip : describe;
  return describeFn(name, suite);
}

export function createOperationalAnonClient(): OperationalSupabaseClient {
  const env = requireOperationalEnv();
  return createOperationalClient(env.supabaseUrl, env.anonKey, "anon");
}

export function createOperationalAdminClient(): OperationalSupabaseClient {
  const env = requireOperationalEnv({ requireServiceRole: true });
  return createOperationalClient(env.supabaseUrl, env.serviceRoleKey, "admin");
}

export function createOptionalOperationalAdminClient(): OperationalSupabaseClient | null {
  const env = getOperationalEnv();
  if (
    getOperationalTargetIssues(env).length > 0 ||
    !env.supabaseUrl ||
    !env.serviceRoleKey
  ) {
    return null;
  }

  return createOperationalClient(env.supabaseUrl, env.serviceRoleKey, "admin");
}

export function createOptionalOperationalAnonClient(): OperationalSupabaseClient | null {
  const env = getOperationalEnv();
  if (
    getOperationalTargetIssues(env).length > 0 ||
    !env.supabaseUrl ||
    !env.anonKey
  ) {
    return null;
  }

  return createOperationalClient(env.supabaseUrl, env.anonKey, "anon");
}

export function hasOperationalAdminEnv(
  requirements: OperationalEnvRequirements = {},
): boolean {
  const missing = getMissingOperationalEnv({
    requireAdminCredentials: requirements.requireAdminCredentials,
    requireAnonKey: requirements.requireAnonKey ?? false,
    requireDriverCredentials: requirements.requireDriverCredentials,
    requireServiceRole: true,
  });

  return missing.length === 0;
}

export function hasOperationalAnonEnv(
  requirements: OperationalEnvRequirements = {},
): boolean {
  const missing = getMissingOperationalEnv({
    ...requirements,
    requireAnonKey: true,
  });

  return missing.length === 0;
}
