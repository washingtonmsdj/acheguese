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
    expect(source).toContain('snapshot.verticals.primaryVertical === "gastronomy"');
    expect(source).toContain('<GastronomyDetailPage');
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
    const seoSource = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyDetailSeo.tsx',
    );

    expect(source).toContain('usePublicGastronomySnapshot');
    expect(source).toContain('MenuItemCard');
    expect(source).toContain('MenuItemDetailDrawer');
    expect(source).toContain('StickyOrderBar');
    expect(source).toContain('GastronomyDetailSeo');
    expect(source).toContain('communityScoped = false');
    expect(seoSource).toContain('link rel="canonical"');
    expect(seoSource).toContain('BreadcrumbList');
    expect(seoSource).toContain('? "noindex, follow"');
    expect(source).toContain('useFavoritesManager(');
    expect(source).toContain('business?.business_data_id');
    expect(source).toContain('business={business}');
  });

  it('keeps company save and recommendation CTAs accessible', () => {
    const pageSource = readProjectFile('src/app/pages/EmpresaDetailLandingPage.tsx');
    const sectionSource = readProjectFile(
      'src/modules/business/company/sections/EmpresaCTAsSection.tsx',
    );
    const actionButtonSource = readProjectFile(
      'src/modules/business/company/components/ctas/ActionButton.tsx',
    );

    expect(pageSource).toContain('loading: recommendLoading');
    expect(pageSource).toContain(
      'const institutionalBusinessDataId = snapshot?.identity.businessId ?? undefined',
    );
    expect(pageSource).toContain('useCanonicalBusinessFavorite(');
    expect(pageSource).toContain('institutionalBusinessDataId,');
    expect(pageSource).toContain('useBusinessRecommendation(institutionalBusinessDataId)');
    expect(pageSource).toContain('recommendLoading={recommendLoading}');
    expect(pageSource).toContain('const robotsContent = props.communityAliasOverride');
    expect(pageSource).toContain('? "noindex, follow"');
    expect(sectionSource).toContain("label={isFavorite ? 'Salvo' : 'Salvar'}");
    expect(sectionSource).toContain("label={hasRecommended ? 'Recomendado' : 'Recomendar'}");
    expect(sectionSource).toContain('ariaPressed={isFavorite}');
    expect(sectionSource).toContain('ariaPressed={hasRecommended}');
    expect(sectionSource).toContain('disabled={recommendLoading}');
    expect(actionButtonSource).toContain('type="button"');
    expect(actionButtonSource).toContain('aria-pressed={ariaPressed}');
    expect(actionButtonSource).toContain('disabled={disabled}');
  });
});
