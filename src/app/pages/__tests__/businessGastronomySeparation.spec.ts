import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('business and gastronomy public page separation', () => {
  it('makes Empresas consume PublicBusinessSnapshot and keeps cart/checkout out', () => {
    const source = readProjectFile('src/app/pages/EmpresaDetailLandingPage.tsx');

    expect(source).toContain('usePublicBusinessSnapshot');
    expect(source).toContain('EmpresaGastronomiaPreviewSection');
    expect(source).not.toContain('useGastronomyDetail');
    expect(source).not.toContain('useMenu(');
    expect(source).not.toContain('useMenusByBusiness');
    expect(source).not.toContain('useActivePromotions');
    expect(source).not.toContain('StickyOrderBar');
    expect(source).not.toContain('GastronomyCheckoutSheet');
    expect(source).not.toContain('MenuItemDetailDrawer');
    expect(source).not.toContain('useGastronomyCart');
  });

  it('makes Gastronomia consume PublicGastronomySnapshot and keep full order flow', () => {
    const source = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx',
    );

    expect(source).toContain('usePublicGastronomySnapshot');
    expect(source).toContain('MenuItemCard');
    expect(source).toContain('MenuItemDetailDrawer');
    expect(source).toContain('StickyOrderBar');
    expect(source).toContain('link rel="canonical"');
    expect(source).toContain('BreadcrumbList');
    expect(source).toContain('businessDataId={business.business_data_id}');
  });
});
