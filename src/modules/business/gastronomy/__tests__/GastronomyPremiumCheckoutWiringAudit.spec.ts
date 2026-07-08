import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy premium checkout wiring audit', () => {
  it('keeps premium CTAs connected to the canonical checkout route', () => {
    const source = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx',
    );

    expect(source).toContain("const handleProceedToCheckout = () => {");
    expect(source).toContain("document.getElementById('premium-menu-section')?.scrollIntoView");
    expect(source).toContain("navigate('checkout', {");
    expect(source).toContain("state: { business }");
    expect(source).toContain("onClick={handleProceedToCheckout}");
    expect(source).toContain("id=\"premium-menu-section\"");
  });
});
