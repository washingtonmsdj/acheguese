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
type BusinessDataFixturePayload = Record<string, unknown>;
type JsonRecord = Record<string, unknown>;

export const E2E_BUSINESS_FIXTURE_PROVENANCE = {
  source: 'e2e',
  source_kind: 'technical_fixture',
} as const;

export const E2E_AUTH_FIXTURE_PROVENANCE = {
  acheguese_fixture: 'operational-e2e',
  source: 'e2e',
  source_kind: 'technical_fixture',
} as const;

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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecord(value: unknown, addition: JsonRecord): JsonRecord {
  return {
    ...(isRecord(value) ? value : {}),
    ...addition,
  };
}

export function withE2EBusinessFixtureProvenance<T>(payload: T): T {
  const enrich = (row: unknown): unknown => {
    if (!isRecord(row)) return row;

    return {
      ...row,
      metadata: mergeRecord(row.metadata, E2E_BUSINESS_FIXTURE_PROVENANCE),
    } satisfies BusinessDataFixturePayload;
  };

  return (Array.isArray(payload) ? payload.map(enrich) : enrich(payload)) as T;
}

export function isE2EAuthFixtureUser(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): boolean {
  const app = user.app_metadata ?? {};
  const metadata = user.user_metadata ?? {};

  return (
    (app.acheguese_fixture === E2E_AUTH_FIXTURE_PROVENANCE.acheguese_fixture ||
      metadata.acheguese_fixture === E2E_AUTH_FIXTURE_PROVENANCE.acheguese_fixture) &&
    (app.source === E2E_AUTH_FIXTURE_PROVENANCE.source ||
      metadata.source === E2E_AUTH_FIXTURE_PROVENANCE.source) &&
    (app.source_kind === E2E_AUTH_FIXTURE_PROVENANCE.source_kind ||
      metadata.source_kind === E2E_AUTH_FIXTURE_PROVENANCE.source_kind)
  );
}

function withE2EAdminCreateUserProvenance(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;

  return {
    ...payload,
    app_metadata: mergeRecord(payload.app_metadata, E2E_AUTH_FIXTURE_PROVENANCE),
    user_metadata: mergeRecord(payload.user_metadata, E2E_AUTH_FIXTURE_PROVENANCE),
  };
}

function withE2ESignUpProvenance(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;

  const options = isRecord(payload.options) ? payload.options : {};
  return {
    ...payload,
    options: {
      ...options,
      data: mergeRecord(options.data, E2E_AUTH_FIXTURE_PROVENANCE),
    },
  };
}

function wrapBusinessDataQueryBuilder<T extends object>(builder: T): T {
  return new Proxy(builder, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (
        (property === 'insert' || property === 'update' || property === 'upsert') &&
        typeof value === 'function'
      ) {
        return (payload: unknown, ...args: unknown[]) =>
          Reflect.apply(value, target, [withE2EBusinessFixtureProvenance(payload), ...args]);
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function wrapOperationalAuthClient(
  client: OperationalSupabaseClient,
): OperationalSupabaseClient {
  const authProxy = new Proxy(client.auth, {
    get(target, property, receiver) {
      if (property === 'admin') {
        const adminApi = target.admin;
        return new Proxy(adminApi, {
          get(adminTarget, adminProperty, adminReceiver) {
            const adminValue = Reflect.get(adminTarget, adminProperty, adminReceiver);
            if (adminProperty === 'createUser' && typeof adminValue === 'function') {
              return (payload: unknown) =>
                Reflect.apply(adminValue, adminTarget, [
                  withE2EAdminCreateUserProvenance(payload),
                ]);
            }
            return typeof adminValue === 'function'
              ? adminValue.bind(adminTarget)
              : adminValue;
          },
        });
      }

      const value = Reflect.get(target, property, receiver);
      if (property === 'signUp' && typeof value === 'function') {
        return (payload: unknown) =>
          Reflect.apply(value, target, [withE2ESignUpProvenance(payload)]);
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'auth') return authProxy;
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as OperationalSupabaseClient;
}

function wrapOperationalBusinessDataClient(
  client: OperationalSupabaseClient,
): OperationalSupabaseClient {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'from') {
        return (relation: string) => {
          const builder = target.from(relation);
          return relation === 'business_data'
            ? wrapBusinessDataQueryBuilder(builder)
            : builder;
        };
      }

      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }) as OperationalSupabaseClient;
}

function createOperationalClient(
  supabaseUrl: string,
  supabaseKey: string,
  kind: OperationalClientKind,
): OperationalSupabaseClient {
  operationalClientSequence += 1;

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: `achegue-operational-${kind}-${operationalClientSequence}`,
    },
  });

  const authWrappedClient = wrapOperationalAuthClient(client);
  const shouldAttachBusinessFixtureProvenance =
    kind === 'admin' || hasApprovedOperationalMutationTarget(supabaseUrl);

  return shouldAttachBusinessFixtureProvenance
    ? wrapOperationalBusinessDataClient(authWrappedClient)
    : authWrappedClient;
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
