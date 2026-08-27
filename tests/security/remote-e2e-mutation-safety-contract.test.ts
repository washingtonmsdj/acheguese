import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const operationalEnv = read('tests/helpers/operational-env.ts');
const playwrightConfig = read('playwright.config.ts');
const slugHistoryValidator = read('scripts/validate-slug-history-final.ts');
const networkSeeder = read('tools/seeds/seed-e2e-network.ts');

describe('Remote E2E mutation safety integration', () => {
  it('gates every operational service-role client on the exact client URL', () => {
    expect(operationalEnv).toContain(
      'assertApprovedOperationalMutationTarget(env.supabaseUrl)',
    );
    expect(operationalEnv).toContain(
      '!hasApprovedOperationalMutationTarget(env.supabaseUrl)',
    );
    expect(operationalEnv).toContain(
      "const SAFE_MUTATION_TARGET_LABEL = 'approved isolated E2E mutation target'",
    );
    expect(operationalEnv).not.toContain("readEnv('SUPABASE_URL')");
  });

  it('blocks known mutating Playwright suites before hooks execute on unsafe targets', () => {
    expect(playwrightConfig).toContain(
      'getRemoteMutationTargetSafety(\n  process.env.VITE_SUPABASE_URL,\n)',
    );

    for (const filename of [
      'admin-pricing',
      'auth-business',
      'business-recommendation-operational',
      'communication-territorial-operational',
      'community-access-gate',
      'gastronomy-onboarding',
      'gastronomy-operational',
    ]) {
      expect(playwrightConfig).toContain(`${filename}\\.spec\\.ts`);
    }

    expect(playwrightConfig).toContain('education[\\\\/].*\\.spec\\.ts');
    expect(playwrightConfig).not.toContain('logout-authenticated\\.spec\\.ts');
    expect(playwrightConfig).not.toContain('territory-home-operational\\.spec\\.ts');
  });

  it('requires an explicit technical business fixture for slug-history mutation', () => {
    expect(slugHistoryValidator).toContain('SLUG_HISTORY_TEST_BUSINESS_ID');
    expect(slugHistoryValidator).toContain(
      "assertApprovedRemoteMutationTarget(config.url)",
    );
    expect(slugHistoryValidator).toContain(".eq('metadata->>source', 'e2e')");
    expect(slugHistoryValidator).toContain(
      ".eq('metadata->>source_kind', 'technical_fixture')",
    );
    expect(slugHistoryValidator).toContain('} finally {');
    expect(slugHistoryValidator).not.toContain('businessRows[0]');
    expect(slugHistoryValidator).not.toContain('Test Business Slug History');
  });

  it('keeps the network seeder isolated and provenance-bound', () => {
    expect(networkSeeder).toContain("assertApprovedRemoteMutationTarget(config.url)");
    expect(networkSeeder).toContain("source: 'e2e'");
    expect(networkSeeder).toContain("source_kind: 'technical_fixture'");
    expect(networkSeeder).toContain('isTechnicalAuthFixture(existingUser)');
    expect(networkSeeder).toContain('isTechnicalBusinessFixture(existingStandalone.metadata)');
    expect(networkSeeder).not.toContain('${SEED.USER_EMAIL} / ${SEED.USER_PASSWORD}');
  });
});
