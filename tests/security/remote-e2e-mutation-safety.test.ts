import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getRemoteMutationTargetSafety,
  linkedProductionProjectRef,
} from '../../scripts/lib/remote-mutation-safety';
import {
  createAnonClient,
  createServiceRoleClient,
} from '../../scripts/lib/supabase-client';
import {
  createOptionalOperationalAdminClient,
  hasOperationalAdminEnv,
} from '../helpers/operational-env';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
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
const originalEntrypoint = process.argv[1];
const isolatedUrl = 'https://isolatedproject123456.supabase.co';

describe('regression: remote E2E mutation safety', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
    process.argv[1] = originalEntrypoint;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    originalEnv.clear();
    process.argv[1] = originalEntrypoint;
  });

  it('closes the divergent SUPABASE_URL versus VITE_SUPABASE_URL production bypass', () => {
    process.env.E2E_REMOTE_MUTATION_TARGET = 'isolated';
    process.env.E2E_REMOTE_MUTATION_APPROVED = 'true';
    process.env.SUPABASE_URL = isolatedUrl;
    process.env.VITE_SUPABASE_URL = `https://${linkedProductionProjectRef()}.supabase.co`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    expect(hasOperationalAdminEnv()).toBe(false);
    expect(createOptionalOperationalAdminClient()).toBeNull();
  });

  it('allows a remote service-role target only when it differs from production and is explicitly approved', () => {
    expect(getRemoteMutationTargetSafety(isolatedUrl).safe).toBe(false);

    process.env.E2E_REMOTE_MUTATION_TARGET = 'isolated';
    process.env.E2E_REMOTE_MUTATION_APPROVED = 'true';
    const safety = getRemoteMutationTargetSafety(isolatedUrl);

    expect(safety.safe).toBe(true);
    expect(safety.kind).toBe('remote-isolated');
  });

  it('blocks direct seed-e2e-users service-role client creation against Production', () => {
    process.argv[1] = resolve(root, 'scripts/seed-e2e-users.ts');
    const productionUrl = `https://${linkedProductionProjectRef()}.supabase.co`;

    expect(() =>
      createServiceRoleClient({
        url: productionUrl,
        serviceRoleKey: 'test-service-role-key',
        envFiles: [],
      }),
    ).toThrow(/linked Production project/);
  });

  it('blocks validate-e2e-setup anon side effects against Production', () => {
    process.argv[1] = resolve(root, 'scripts/validate-e2e-setup.ts');
    const productionUrl = `https://${linkedProductionProjectRef()}.supabase.co`;

    expect(() =>
      createAnonClient({
        url: productionUrl,
        anonKey: 'test-publishable-key',
        envFiles: [],
      }),
    ).toThrow(/linked Production project/);
  });

  it('keeps known mutating Playwright suites blocked while Heavy read-only specs remain eligible', () => {
    const playwright = read('playwright.config.ts');

    for (const filename of [
      'admin-pricing',
      'auth-business',
      'business-recommendation-operational',
      'communication-territorial-operational',
      'community-access-gate',
      'gastronomy-onboarding',
      'gastronomy-operational',
    ]) {
      expect(playwright).toContain(filename);
    }

    expect(playwright).toContain('mutatingE2EIgnore');
    expect(playwright).not.toContain('logout-authenticated.spec.ts');
    expect(playwright).not.toContain('territory-home-operational.spec.ts');
  });

  it('removes automatic real-business selection and locks every known mutating operational entrypoint', () => {
    const slugValidator = read('scripts/validate-slug-history-final.ts');
    const networkSeeder = read('scripts/seed-e2e-network.ts');
    const supabaseClient = read('scripts/lib/supabase-client.mjs');

    expect(slugValidator).toContain('SLUG_HISTORY_TEST_BUSINESS_ID');
    expect(slugValidator).toContain("metadata->>source_kind', 'technical_fixture");
    expect(slugValidator).toContain('} finally {');
    expect(slugValidator).not.toContain('businessRows[0]');

    expect(networkSeeder).toContain("acheguese_fixture: FIXTURE_KIND");
    expect(networkSeeder).toContain("source_kind: 'technical_fixture'");
    expect(networkSeeder).toContain('isTechnicalBusinessFixture(existingStandalone.metadata)');

    for (const entrypoint of [
      'seed-e2e-users',
      'seed-e2e-network',
      'validate-slug-history-final',
      'validate-reconciliation-final',
      'validate-e2e-setup',
      'validate-gate3-metadata',
      'community-feed-authz-probe',
      'community-direct-messaging-authz-probe',
      'reviews-core-authz-probe',
      'trust-operational-authz-probe',
      'moderation-audit-authz-probe',
    ]) {
      expect(supabaseClient).toContain(`'${entrypoint}'`);
    }
  });
});
