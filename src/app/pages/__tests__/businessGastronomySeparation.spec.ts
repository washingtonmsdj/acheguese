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
    expect(source).not.toContain('EmpresaGastronomiaPreviewSection');
    expect(source).not.toContain('snapshot.verticals.primaryVertical === "gastronomy"');
    expect(source).not.toContain('<GastronomyDetailPage');
    expect(source).not.toContain('@/modules/business/gastronomy/');
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
    const menuSectionSource = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyDetailMenuSection.tsx',
    );
    const seoSource = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyDetailSeo.tsx',
    );

    expect(source).toContain('usePublicGastronomySnapshot');
    expect(source).toContain('GastronomyDetailMenuSection');
    expect(menuSectionSource).toContain('MenuItemCard');
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

  it('keeps save and recommendation actions accessible on the active company detail', () => {
    const pageSource = readProjectFile('src/app/pages/EmpresaDetailLandingPage.tsx');
    const detailSource = readProjectFile(
      'src/modules/business/company/pages/TerritoryBusinessDetail.tsx',
    );

    expect(pageSource).toContain(
      'const institutionalBusinessDataId = snapshot?.identity.businessId ?? undefined',
    );
    expect(pageSource).toContain('useCanonicalBusinessFavorite(');
    expect(pageSource).toContain('useBusinessRecommendation(institutionalBusinessDataId)');
    expect(pageSource).toContain('loading: recommendationLoading');
    expect(pageSource).toContain(
      'BusinessHoursService.getOperationConfig(institutionalBusinessDataId)',
    );
    expect(pageSource).not.toContain(
      'BusinessHoursService.getOperationConfig(snapshotBusiness.id)',
    );
    expect(pageSource).toContain('isRecommended={isRecommended}');
    expect(pageSource).toContain('recommendationLoading={recommendationLoading}');
    expect(pageSource).toContain(
      'onToggleRecommendation={() => void toggleRecommendation()}',
    );
    expect(pageSource).toContain('const robotsContent = snapshot.seo.robots');
    expect(pageSource).not.toContain('communityAliasOverride');

    expect(detailSource).toContain('aria-pressed={isFavorite}');
    expect(detailSource).toContain('{isFavorite ? "Salvo" : "Salvar"}');
    expect(detailSource).toContain('aria-pressed={isRecommended}');
    expect(detailSource).toContain('{isRecommended ? "Recomendado" : "Recomendar"}');
    expect(detailSource).toContain('disabled={recommendationLoading}');
    expect(detailSource).toContain('onClick={onToggleRecommendation}');
  });
});
