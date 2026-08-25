import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertApprovedOperationalMutationTarget,
  getOperationalMutationTargetSafety,
  linkedProductionProjectRef,
} from '../helpers/operational-mutation-safety';
import {
  createOptionalOperationalAdminClient,
  hasOperationalAdminEnv,
} from '../helpers/operational-env';

const ENV_KEYS = [
  'E2E_REMOTE_MUTATION_TARGET',
  'E2E_REMOTE_MUTATION_APPROVED',
  'PLAYWRIGHT_BASE_URL',
  'VITE_PUBLIC_APP_URL',
  'VERCEL_ENV',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
] as const;

const originalEnv = new Map<string, string | undefined>();
const ISOLATED_PROJECT_REF = 'isolatedproject123456';
const ISOLATED_URL = `https://${ISOLATED_PROJECT_REF}.supabase.co`;

function approveRemoteIsolation(): void {
  process.env.E2E_REMOTE_MUTATION_TARGET = 'isolated';
  process.env.E2E_REMOTE_MUTATION_APPROVED = 'true';
}

function configureAdminTarget(url: string): void {
  process.env.VITE_SUPABASE_URL = url;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
}

describe('Operational admin mutation target safety', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalEnv.clear();
  });

  it('permite Supabase local sem opt-in remoto', () => {
    const safety = getOperationalMutationTargetSafety('http://127.0.0.1:54321');

    expect(safety.safe).toBe(true);
    expect(safety.kind).toBe('local');
  });

  it('bloqueia projeto remoto sem opt-in explícito', () => {
    const safety = getOperationalMutationTargetSafety(ISOLATED_URL);

    expect(safety.safe).toBe(false);
    expect(safety.reason).toContain('E2E_REMOTE_MUTATION_TARGET=isolated');
  });

  it('permite projeto remoto diferente de Production somente com opt-in explícito', () => {
    approveRemoteIsolation();
    const safety = getOperationalMutationTargetSafety(ISOLATED_URL);

    expect(safety.safe).toBe(true);
    expect(safety.kind).toBe('remote-isolated');
    expect(() => assertApprovedOperationalMutationTarget(ISOLATED_URL)).not.toThrow();
  });

  it('recusa o project ref de Production mesmo com opt-in explícito', () => {
    approveRemoteIsolation();
    const productionUrl = `https://${linkedProductionProjectRef()}.supabase.co`;
    const safety = getOperationalMutationTargetSafety(productionUrl);

    expect(safety.safe).toBe(false);
    expect(safety.kind).toBe('production');
    expect(() => assertApprovedOperationalMutationTarget(productionUrl)).toThrow(
      /linked Production project/,
    );
  });

  it('recusa app Production mesmo quando o banco remoto seria isolado', () => {
    approveRemoteIsolation();
    process.env.PLAYWRIGHT_BASE_URL = 'https://acheguese.com.br';

    const safety = getOperationalMutationTargetSafety(ISOLATED_URL);
    expect(safety.safe).toBe(false);
    expect(safety.kind).toBe('production');
  });

  it('recusa host remoto cujo project ref não pode ser provado', () => {
    approveRemoteIsolation();

    const safety = getOperationalMutationTargetSafety('https://db.example.test');
    expect(safety.safe).toBe(false);
    expect(safety.kind).toBe('unproven');
  });

  it('fecha o bypass SUPABASE_URL isolado vs VITE_SUPABASE_URL Production', () => {
    approveRemoteIsolation();
    process.env.SUPABASE_URL = ISOLATED_URL;
    configureAdminTarget(`https://${linkedProductionProjectRef()}.supabase.co`);

    expect(hasOperationalAdminEnv()).toBe(false);
    expect(createOptionalOperationalAdminClient()).toBeNull();
  });

  it('habilita admin client somente quando a URL exata do client é isolada e aprovada', () => {
    approveRemoteIsolation();
    configureAdminTarget(ISOLATED_URL);

    expect(hasOperationalAdminEnv()).toBe(true);
    expect(createOptionalOperationalAdminClient()).not.toBeNull();
  });
});
