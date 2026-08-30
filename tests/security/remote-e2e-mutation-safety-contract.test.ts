import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const operationalEnv = read('tests/helpers/operational-env.ts');
const educationSetup = read('tests/helpers/education-setup.ts');
const playwrightConfig = read('playwright.config.ts');
const slugHistoryValidator = read('tools/supabase/validate-slug-history-final.ts');
const networkSeeder = read('tools/seeds/seed-e2e-network.ts');
const e2eUserSeeder = read('tools/seeds/seed-e2e-users.ts');

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

  it('stamps operational auth and business fixtures with technical provenance', () => {
    expect(operationalEnv).toContain('E2E_AUTH_FIXTURE_PROVENANCE');
    expect(operationalEnv).toContain("acheguese_fixture: 'operational-e2e'");
    expect(operationalEnv).toContain("source: 'e2e'");
    expect(operationalEnv).toContain("source_kind: 'technical_fixture'");
    expect(operationalEnv).toContain('withE2EAdminCreateUserProvenance');
    expect(operationalEnv).toContain('withE2ESignUpProvenance');
    expect(operationalEnv).toContain('withE2EBusinessFixtureProvenance');
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

  it('keeps Education mutations bound to explicit credentials and technical Business provenance', () => {
    expect(educationSetup).toContain('resolveTechnicalBusiness');
    expect(educationSetup).toContain(
      'business_data is not marked source=e2e/source_kind=technical_fixture',
    );
    expect(educationSetup).toContain(".eq('user_id', user.id)");
    expect(educationSetup).toContain(".in('role', ['owner', 'admin'])");
    expect(educationSetup).toContain('getE2ECredentials()');
    expect(educationSetup).not.toContain('updateUserById');
    expect(educationSetup).not.toContain('TestPass123!');
    expect(educationSetup).not.toContain('getUserById(member.user_id)');
  });

  it('keeps the canonical E2E user seeder isolated and marker-only', () => {
    expect(e2eUserSeeder).toContain('getSupabaseConfig');
    expect(e2eUserSeeder).toContain(
      'assertApprovedRemoteMutationTarget(config.url)',
    );
    expect(e2eUserSeeder).toContain('isManagedFixture(user)');
    expect(e2eUserSeeder).toContain(
      'Refusing to reconcile an Auth user without the canonical fixture marker.',
    );
    expect(e2eUserSeeder).not.toContain('E2E_ADOPT_USERNAME');
    expect(e2eUserSeeder).not.toContain('adoptTechnicalUser');
    expect(e2eUserSeeder).not.toContain('Refusing to adopt a profile');
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
