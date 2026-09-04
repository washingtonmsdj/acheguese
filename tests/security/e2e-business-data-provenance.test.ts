import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  E2E_BUSINESS_FIXTURE_PROVENANCE,
  withE2EBusinessFixtureProvenance,
} from '../helpers/operational-env';

const root = process.cwd();
const writerPaths = [
  'tests/e2e/business-recommendation-operational.spec.ts',
  'tests/e2e/education/education-setup.spec.ts',
  'tests/e2e/gastronomy-onboarding.spec.ts',
  'tests/e2e/gastronomy-operational.spec.ts',
] as const;

describe('E2E business_data fixture provenance', () => {
  it('adds technical provenance without dropping functional metadata', () => {
    const payload = withE2EBusinessFixtureProvenance({
      business_name: 'Fixture',
      metadata: {
        phone: '71999990000',
        whatsapp: '5571999990000',
        modos_atendimento: ['presencial'],
      },
    });

    expect(payload).toEqual({
      business_name: 'Fixture',
      metadata: {
        phone: '71999990000',
        whatsapp: '5571999990000',
        modos_atendimento: ['presencial'],
        source: 'e2e',
        source_kind: 'technical_fixture',
      },
    });
  });

  it('creates metadata when a business_data writer does not provide it', () => {
    const payload = withE2EBusinessFixtureProvenance({
      business_name: 'Fixture sem metadata',
    });

    expect(payload.metadata).toEqual(E2E_BUSINESS_FIXTURE_PROVENANCE);
  });

  it('enriches every row in batched insert/upsert payloads', () => {
    const payload = withE2EBusinessFixtureProvenance([
      { business_name: 'A' },
      { business_name: 'B', metadata: { source: 'legacy', custom: true } },
    ]);

    expect(payload[0].metadata).toEqual(E2E_BUSINESS_FIXTURE_PROVENANCE);
    expect(payload[1].metadata).toEqual({
      source: 'e2e',
      source_kind: 'technical_fixture',
      custom: true,
    });
  });

  it('keeps every writer from issue #83 behind operational Supabase factories', () => {
    for (const path of writerPaths) {
      const source = readFileSync(resolve(root, path), 'utf8');
      expect(source, path).toMatch(/create(?:Optional)?Operational(?:Anon|Admin)Client/);
      expect(source, path).toMatch(/\.from\(["']business_data["']\)/);
      expect(source, path).not.toMatch(/\bcreateClient\s*\(/);
    }
  });

  it('covers approved anon and admin operational clients at the shared factory', () => {
    const source = readFileSync(resolve(root, 'tests/helpers/operational-env.ts'), 'utf8');

    expect(source).toContain("relation === 'business_data'");
    expect(source).toContain("kind === 'admin' || hasApprovedOperationalMutationTarget(supabaseUrl)");
    expect(source).toContain('wrapOperationalBusinessDataClient(authWrappedClient)');
  });
});
