import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('repository root artifact governance', () => {
  it('keeps npm as the single package-manager authority', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      packageManager?: string;
    };

    expect(pkg.packageManager).toMatch(/^npm@/);
    expect(existsSync('package-lock.json')).toBe(true);
    expect(existsSync('bun.lock')).toBe(false);
  });

  it('keeps dead standalone configs out of the root', () => {
    expect(existsSync('playwright.mapa.config.ts')).toBe(false);
    expect(existsSync('tsconfig.typecheck.events-checkin.json')).toBe(false);
  });

  it('keeps Maps CI on canonical validators instead of synthetic missing files', () => {
    const workflow = readFileSync('.github/workflows/security-check.yml', 'utf8');
    const mapsScript = readFileSync('tools/architecture/validate-maps-integration.sh', 'utf8');

    expect(workflow).toContain('run: npm run validate:maps');
    expect(workflow).toContain('run: npm run lint:maps');
    expect(workflow).not.toContain('src/test-maps-violation-1.ts');
    expect(workflow).not.toContain('src/modules/test-maps-violation-2.ts');
    expect(mapsScript).not.toContain('playwright.mapa.config.ts');
    expect(mapsScript).toContain('playwright.config.ts');
  });

  it('keeps canonical Supabase type sync coupled to schema authority changes', () => {
    const workflow = readFileSync('.github/workflows/supabase-types-sync.yml', 'utf8');

    expect(workflow).toContain('- "supabase/migrations/**"');
    expect(workflow).toContain('- "supabase/config.toml"');
    expect(workflow).toContain('- "tools/supabase/generate-supabase-types.ts"');
    expect(workflow).toContain('TYPES_PATH: "src/integrations/supabase/types.generated.ts"');
    expect(workflow).toContain('gen types typescript --project-id');
    expect(workflow).not.toContain('src/integrations/supabase/types.ts');
    expect(workflow).not.toContain('src/shared/types/database.types.ts');
  });

  it('keeps launch auth defaults fail-closed and password policy hardened', () => {
    const config = readFileSync('supabase/config.toml', 'utf8');

    expect(config).toContain('enable_anonymous_sign_ins = false');
    expect(config).toContain('enable_manual_linking = false');
    expect(config).toContain('minimum_password_length = 12');
    expect(config).toContain('password_requirements = "lower_upper_letters_digits_symbols"');
    expect(config).toContain('enable_confirmations = true');
    expect(config).toContain('secure_password_change = true');
  });
});
