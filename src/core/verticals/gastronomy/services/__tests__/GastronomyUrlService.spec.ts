import { describe, expect, it } from 'vitest';

import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';

describe('GastronomyUrlService', () => {
  it('centraliza home, listagem territorial e detalhe legado explicitamente nomeado', () => {
    expect(GastronomyUrlService.getHomeUrl()).toBe('/gastronomia');
    expect(GastronomyUrlService.getTerritoryUrl('/br/ba/salvador/pituba')).toBe(
      '/gastronomia/ba/salvador/pituba',
    );
    expect(
      GastronomyUrlService.getLegacyDetailUrlFromTerritory(
        '/br/ba/salvador/rio-vermelho',
        'cafe-central',
      ),
    ).toBe('/gastronomia/ba/salvador/rio-vermelho/cafe-central');
  });

  it('usa a URL publica de empresa como detalhe canonico de restaurante', () => {
    expect(
      GastronomyUrlService.getCanonicalUrl({
        id: 'biz-1',
        slug: 'cafe-central',
        geographic_path: '/br/ba/salvador/rio-vermelho',
      }),
    ).toBe('/empresas/ba/salvador/rio-vermelho/cafe-central');

    expect(
      GastronomyUrlService.getCanonicalUrl({
        id: 'biz-1',
        slug: 'cafe-central',
        geographic_path: '/br/ba/salvador/rio-vermelho',
        community_alias: 'rio-vermelho',
      }),
    ).toBe('/rio-vermelho/cafe-central');
  });

  it('rejeita slugs com separadores para evitar path injection', () => {
    expect(() =>
      GastronomyUrlService.getLegacyDetailUrlFromTerritory(
        '/br/ba/salvador/pituba',
        'cafe/extra',
      ),
    ).toThrow('segmento unico');
  });
});
