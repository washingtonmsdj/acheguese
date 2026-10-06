import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('Gitleaks scoped allowlists', () => {
  it('keeps public Supabase client identifiers limited to explicit tracked surfaces', () => {
    const config = readFileSync(join(ROOT, '.gitleaks.toml'), 'utf8');

    expect(config).toContain(
      "'''^\\.github/workflows/certify-heavy\\.yml$'''",
    );
    expect(config).toContain(
      "'''^\\.github/workflows/ssot-tests\\.yml$'''",
    );
    expect(config).toContain(
      "'''^tests/architecture/mvp-core-module-boundary\\.test\\.ts$'''",
    );
    expect(config).toContain(
      "'''^tests/ssot-authenticated-release-public-env\\.test\\.ts$'''",
    );

    expect(config).not.toContain("'''^\\.github/workflows/'''");
    expect(config).not.toContain("'''^tests/'''");
  });

  it('allows database URL false positives only when both path and safe fixture pattern match', () => {
    const config = readFileSync(join(ROOT, '.gitleaks.toml'), 'utf8');

    expect(config).toContain(
      'description = "Runtime-composed Supabase DB URL uses an env-sourced password, never a tracked literal"',
    );
    expect(config).toContain('condition = "AND"');
    expect(config).toContain(
      "'''^\\.github/workflows/supabase-types-sync\\.yml$'''",
    );
    expect(config).toContain(
      "'''postgresql://postgres\\.\\$projectRef.*\\$encodedPassword.*\\$poolerHost'''",
    );

    expect(config).toContain(
      'description = "Education INEP stager tests use the literal word secret only as parser fixtures"',
    );
    expect(config).toContain(
      "'''^tests/scripts/public-education-inep-stager\\.test\\.ts$'''",
    );
    const fixturePrefix = ['postgres', 'ql://'].join('');
    expect(config).toContain(
      `'''${fixturePrefix}[^:]+:secret@'''`,
    );
  });
});
