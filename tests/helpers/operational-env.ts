import { describe } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

function readEnv(key: string): string | undefined {
  return process.env[key] || import.meta.env[key];
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

  return missing.map((key) => ENV_LABELS[key]);
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
  suite: Parameters<typeof describe>[1],
): ReturnType<typeof describe> {
  const missing = getMissingOperationalEnv(requirements);
  const describeFn = missing.length > 0 ? describe.skip : describe;
  return describeFn(name, suite);
}

export function createOperationalAnonClient(): SupabaseClient {
  const env = requireOperationalEnv();
  return createClient(env.supabaseUrl, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createOperationalAdminClient(): SupabaseClient {
  const env = requireOperationalEnv({ requireServiceRole: true });
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
