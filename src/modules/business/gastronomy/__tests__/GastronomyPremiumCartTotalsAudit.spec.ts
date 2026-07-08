import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy premium cart totals audit', () => {
  it('uses the cart snapshot as source of truth for delivery fee and total', () => {
    const source = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx',
    );

    expect(source).toContain('const deliveryFee = cart?.delivery_fee ?? 0;');
    expect(source).toContain('const total = cart?.total ?? subtotal;');
    expect(source).not.toContain('const deliveryFee = profile.delivery_fee ?? 0;');
  });
});
