import { describe, expect, it } from 'vitest';
import {
  BUSINESS_PUBLIC_URL_PREVIEW_SLUG,
  BUSINESS_PREMIUM_ROUTE_CHILD_SEGMENTS,
  buildBusinessCityListingUrl,
  buildBusinessPremiumRoute,
  buildBusinessPremiumUrl,
  buildBusinessPublicListingUrl,
  buildBusinessPublicUrlFromSegments,
  buildBusinessPublicUrlFromTerritory,
  buildBusinessPublicUrlPreview,
} from '@/core/business/utils/businessPublicUrls';

describe('businessPublicUrls', () => {
  it('builds canonical territory-first business URLs from internal geographic_path', () => {
    expect(
      buildBusinessPublicUrlFromTerritory('/br/ba/salvador/rio-vermelho', 'cafe-central'),
    ).toBe('/ba/salvador/rio-vermelho/empresas/cafe-central');
  });

  it('builds canonical territory-first business URLs from explicit territory segments', () => {
    expect(
      buildBusinessPublicUrlFromSegments({
        state: 'ba',
        city: 'salvador',
        territorySlug: 'pituba',
        slug: 'loja-central',
      }),
    ).toBe('/ba/salvador/pituba/empresas/loja-central');
  });

  it('builds city and scoped territory listings through the same module slug SSOT', () => {
    expect(buildBusinessCityListingUrl('ba', 'salvador')).toBe('/ba/salvador/empresas');
    expect(
      buildBusinessPublicListingUrl({
        state: 'ba',
        city: 'salvador',
        territorySlug: 'barra',
      }),
    ).toBe('/ba/salvador/barra/empresas');
  });

  it('builds business identity preview with centralized placeholders', () => {
    expect(buildBusinessPublicUrlPreview(BUSINESS_PUBLIC_URL_PREVIEW_SLUG)).toBe(
      '/:uf/:cidade/:territorio/empresas/seu-link',
    );
  });

  it('builds premium business routes from centralized route segments', () => {
    expect(buildBusinessPremiumUrl('cafe-central')).toBe('/p/cafe-central');
    expect(
      buildBusinessPremiumRoute('cafe-central', [
        BUSINESS_PREMIUM_ROUTE_CHILD_SEGMENTS.product,
        'espresso',
      ]),
    ).toBe('/p/cafe-central/produto/espresso');
  });

  it('rejects slugs that would create extra path segments', () => {
    expect(() => buildBusinessPremiumUrl('loja/extra')).toThrow(
      /slug premium da empresa/,
    );
  });
});
