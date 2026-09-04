import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const operationalEnv = read('tests/helpers/operational-env.ts');
const authHelper = read('tests/helpers/auth-helper.ts');
const educationSetup = read('tests/helpers/education-setup.ts');
const gateSetup = read('tests/helpers/gate6-setup-helpers.ts');
const gateFixtures = read('tests/fixtures/gate6-fixtures.json');
const gate5Availability = read('tests/operational/gate5-availability-test.test.ts');
const pricingRuntime = read('src/core/pricing/__tests__/PricingService.runtime.test.ts');
const playwrightConfig = read('playwright.config.ts');
const slugHistoryValidator = read('tools/supabase/validate-slug-history-final.ts');
const networkSeeder = read('tools/seeds/seed-e2e-network.ts');
const e2eUserSeeder = read('tools/seeds/seed-e2e-users.ts');
const businessLifecycleRunner = read('tools/release/run-business-lifecycle-e2e.mjs');
const packageJson = read('package.json');
const operationalAlphaInvite = read('tools/supabase/operational-alpha-invite.mjs');
const technicalAuthCreators = [
  'tools/seeds/seed-e2e-users.ts',
  'tools/seeds/seed-e2e-network.ts',
  'tools/security/community-feed-authz-probe.mjs',
  'tools/security/community-direct-messaging-authz-probe.mjs',
  'tools/security/reviews-core-authz-probe.mjs',
  'tools/security/trust-operational-authz-probe.mjs',
  'tools/security/moderation-audit-authz-probe.mjs',
] as const;

const RETIRED_NON_TECHNICAL_PROFILE_IDS = [
  '2357467c-4f5e-4285-bf6b-39628c6a44ad',
  'b374bdab-cd76-43b2-bb3c-eb844d096acb',
];

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

  it('keeps technical Auth creation behind canonical alpha invites on isolated targets', () => {
    expect(operationalAlphaInvite).toContain('assertApprovedRemoteMutationTarget(supabaseUrl)');
    expect(operationalAlphaInvite).toContain("'alpha_access_issue_invite'");
    expect(operationalAlphaInvite).toContain("'alpha_access_delete_operational_invite'");
    expect(operationalAlphaInvite).toContain("const OPERATIONAL_ALPHA_INVITE_NOTE = 'e2e_seed'");
    expect(operationalAlphaInvite).toContain('finally {');
    expect(operationalAlphaInvite).not.toContain('alpha_access_set_admissions');
    expect(operationalAlphaInvite).not.toMatch(/from\s*\(\s*['\"](?:private\.)?alpha_access_invites/);

    expect(operationalEnv).toContain('wrapOperationalTechnicalAuthClient');
    for (const path of technicalAuthCreators) {
      expect(read(path), path).toContain('wrapOperationalTechnicalAuthClient');
    }
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

  it('keeps Business lifecycle certification isolated, explicit and zero-retry', () => {
    expect(packageJson).toContain(
      '"test:e2e:business-lifecycle": "node tools/release/run-business-lifecycle-e2e.mjs"',
    );
    expect(businessLifecycleRunner).toContain(
      'getRemoteMutationTargetSafety(supabaseUrl)',
    );
    expect(businessLifecycleRunner).toContain(
      "'SUPABASE_SERVICE_ROLE_KEY'",
    );
    expect(businessLifecycleRunner).toContain(
      "'VITE_SUPABASE_PUBLISHABLE_KEY'",
    );
    expect(businessLifecycleRunner).toContain(
      "'tests/e2e/auth-business.spec.ts'",
    );
    expect(businessLifecycleRunner).toContain("'--retries=0'");
    expect(businessLifecycleRunner).toContain("'--grep'");
    expect(businessLifecycleRunner).toContain(
      'login cria edita publica e gerencia empresa pelo fluxo canonico',
    );
    expect(businessLifecycleRunner).not.toContain(
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
    );
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

  it('authenticates registered operational actors without mutating passwords', () => {
    expect(authHelper).toContain("tests/fixtures/gate6-fixtures.json");
    expect(authHelper).toContain("type: 'magiclink'");
    expect(authHelper).toContain('properties.hashed_token');
    expect(authHelper).toContain('expected private ${expectedType} fixture');
    expect(authHelper).not.toContain('updateUserById');
    expect(authHelper).not.toContain('TestPass123!');
    expect(authHelper).not.toContain('authenticateAsFirstAdminProfile');
  });

  it('validates Gate driver provenance before the first service-role mutation', () => {
    const authIndex = gateSetup.indexOf('await authenticateAsProfile(driverProfileId)');
    const driverDataIndex = gateSetup.indexOf(".from('driver_data')");

    expect(authIndex).toBeGreaterThanOrEqual(0);
    expect(driverDataIndex).toBeGreaterThan(authIndex);
  });

  it('keeps mobility gate actors on the reviewed private technical registry', () => {
    for (const retiredProfileId of RETIRED_NON_TECHNICAL_PROFILE_IDS) {
      expect(gateFixtures).not.toContain(retiredProfileId);
      expect(gate5Availability).not.toContain(retiredProfileId);
    }

    for (const technicalDriverId of [
      'b2b405cb-bf9c-405b-ad68-759de702dfb0',
      'e114b313-3d76-452b-8dca-3bb8079ca59e',
      'a1f45031-5fee-4f16-85c0-8d73356fc830',
    ]) {
      expect(gateFixtures).toContain(technicalDriverId);
      expect(gate5Availability).toContain(technicalDriverId);
    }

    for (const technicalPassengerId of [
      'd2028c2e-4ed8-4898-bd0a-030a0743c283',
      '6fb6aa61-7b40-4deb-867a-72688d1bccc1',
    ]) {
      expect(gateFixtures).toContain(technicalPassengerId);
    }
  });

  it('requires an explicitly configured admin for Pricing runtime', () => {
    expect(pricingRuntime).toContain('authenticateAsConfiguredAdminProfile');
    expect(pricingRuntime).toContain('E2E_ADMIN_EMAIL');
    expect(pricingRuntime).toContain('E2E_ADMIN_PASSWORD');
    expect(pricingRuntime).not.toContain('authenticateAsFirstAdminProfile');
    expect(authHelper).toContain('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required');
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
    expect(e2eUserSeeder).toContain('wrapOperationalTechnicalAuthClient');
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
    expect(networkSeeder).toContain('wrapOperationalTechnicalAuthClient');
    expect(networkSeeder).toContain('isTechnicalAuthFixture(existingUser)');
    expect(networkSeeder).toContain('isTechnicalBusinessFixture(existingStandalone.metadata)');
    expect(networkSeeder).not.toContain('${SEED.USER_EMAIL} / ${SEED.USER_PASSWORD}');
  });
});
