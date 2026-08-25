import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertApprovedOperationalMutationTarget,
  hasApprovedOperationalMutationTarget,
} from './operational-mutation-safety';

export type OperationalSupabaseClient = SupabaseClient<any, 'public', any>;
type OperationalSuite = () => void;
type DescribeLike = {
  (name: string, suite: OperationalSuite): void;
  skip: (name: string, suite: OperationalSuite) => void;
};
type OperationalClientKind = 'anon' | 'admin';

export interface OperationalEnvRequirements {
  requireAnonKey?: boolean;
  requireDriverCredentials?: boolean;
  requireServiceRole?: boolean;
}

export interface OperationalEnv {
  anonKey?: string;
  driverEmail?: string;
  driverPassword?: string;
  serviceRoleKey?: string;
  supabaseUrl?: string;
}

const ENV_LABELS: Record<keyof OperationalEnv, string> = {
  anonKey: 'VITE_SUPABASE_PUBLISHABLE_KEY',
  driverEmail: 'E2E_USER_EMAIL or TEST_DRIVER_EMAIL',
  driverPassword: 'E2E_USER_PASSWORD or TEST_DRIVER_PASSWORD',
  serviceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY',
  supabaseUrl: 'VITE_SUPABASE_URL',
};
const SAFE_MUTATION_TARGET_LABEL = 'approved isolated E2E mutation target';
let operationalClientSequence = 0;

function readEnv(key: string): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
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
    anonKey: readEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || readEnv('VITE_SUPABASE_ANON_KEY'),
    driverEmail: readEnv('E2E_USER_EMAIL') || readEnv('TEST_DRIVER_EMAIL'),
    driverPassword: readEnv('E2E_USER_PASSWORD') || readEnv('TEST_DRIVER_PASSWORD'),
    serviceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY') || readEnv('SUPABASE_SECRET_KEY'),
    supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  };
}

export function getMissingOperationalEnv(requirements: OperationalEnvRequirements = {}): string[] {
  const env = getOperationalEnv();
  const missing: (keyof OperationalEnv)[] = [];

  if (!env.supabaseUrl) missing.push('supabaseUrl');
  if (requirements.requireAnonKey !== false && !env.anonKey) missing.push('anonKey');
  if (requirements.requireServiceRole && !env.serviceRoleKey) missing.push('serviceRoleKey');
  if (requirements.requireDriverCredentials) {
    if (!env.driverEmail) missing.push('driverEmail');
    if (!env.driverPassword) missing.push('driverPassword');
  }

  const labels = missing.map((key) => ENV_LABELS[key]);
  if (
    requirements.requireServiceRole &&
    env.supabaseUrl &&
    env.serviceRoleKey &&
    !hasApprovedOperationalMutationTarget(env.supabaseUrl)
  ) {
    labels.push(SAFE_MUTATION_TARGET_LABEL);
  }

  return labels;
}

export function requireOperationalEnv(requirements: OperationalEnvRequirements = {}): Required<OperationalEnv> {
  const missing = getMissingOperationalEnv(requirements);
  if (missing.length > 0) {
    throw new Error(`Operational test environment is incomplete. Missing: ${missing.join(', ')}.`);
  }

  return getOperationalEnv() as Required<OperationalEnv>;
}

export function describeOperational(
  name: string,
  requirements: OperationalEnvRequirements,
  suite: OperationalSuite,
): void {
  const describe = (globalThis as typeof globalThis & { describe?: DescribeLike }).describe;
  if (!describe) {
    throw new Error('describeOperational requires a test runner with global describe support.');
  }

  const missing = getMissingOperationalEnv(requirements);
  const describeFn = missing.length > 0 ? describe.skip : describe;
  return describeFn(name, suite);
}

export function createOperationalAnonClient(): OperationalSupabaseClient {
  const env = requireOperationalEnv();
  return createOperationalClient(env.supabaseUrl, env.anonKey, 'anon');
}

export function createOperationalAdminClient(): OperationalSupabaseClient {
  const env = requireOperationalEnv({ requireServiceRole: true });
  assertApprovedOperationalMutationTarget(env.supabaseUrl);
  return createOperationalClient(env.supabaseUrl, env.serviceRoleKey, 'admin');
}

export function createOptionalOperationalAdminClient(): OperationalSupabaseClient | null {
  const env = getOperationalEnv();
  if (
    !env.supabaseUrl ||
    !env.serviceRoleKey ||
    !hasApprovedOperationalMutationTarget(env.supabaseUrl)
  ) {
    return null;
  }

  return createOperationalClient(env.supabaseUrl, env.serviceRoleKey, 'admin');
}

export function createOptionalOperationalAnonClient(): OperationalSupabaseClient | null {
  const env = getOperationalEnv();
  if (!env.supabaseUrl || !env.anonKey) {
    return null;
  }

  return createOperationalClient(env.supabaseUrl, env.anonKey, 'anon');
}

export function hasOperationalAdminEnv(requirements: OperationalEnvRequirements = {}): boolean {
  const missing = getMissingOperationalEnv({
    requireAnonKey: requirements.requireAnonKey ?? false,
    requireDriverCredentials: requirements.requireDriverCredentials,
    requireServiceRole: true,
  });

  return missing.length === 0;
}

export function hasOperationalAnonEnv(requirements: OperationalEnvRequirements = {}): boolean {
  const missing = getMissingOperationalEnv({
    ...requirements,
    requireAnonKey: true,
  });

  return missing.length === 0;
}
