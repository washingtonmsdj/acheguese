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
});
