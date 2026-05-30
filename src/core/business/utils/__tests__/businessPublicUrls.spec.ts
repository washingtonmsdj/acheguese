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
  it('builds canonical public business URLs from internal geographic_path', () => {
    expect(
      buildBusinessPublicUrlFromTerritory('/br/ba/salvador/rio-vermelho', 'cafe-central'),
    ).toBe('/empresas/ba/salvador/rio-vermelho/cafe-central');
  });

  it('builds canonical public business URLs from explicit territory segments', () => {
    expect(
      buildBusinessPublicUrlFromSegments({
        state: 'ba',
        city: 'salvador',
        district: 'pituba',
        slug: 'loja-central',
      }),
    ).toBe('/empresas/ba/salvador/pituba/loja-central');
  });

  it('builds city and district listings through the same module slug SSOT', () => {
    expect(buildBusinessCityListingUrl('ba', 'salvador')).toBe('/empresas/ba/salvador');
    expect(
      buildBusinessPublicListingUrl({
        state: 'ba',
        city: 'salvador',
        district: 'barra',
      }),
    ).toBe('/empresas/ba/salvador/barra');
  });

  it('builds business identity preview with centralized placeholders', () => {
    expect(buildBusinessPublicUrlPreview(BUSINESS_PUBLIC_URL_PREVIEW_SLUG)).toBe(
      '/empresas/:uf/:cidade/:bairro/seu-link',
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
