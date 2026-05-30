import { describe, expect, it } from 'vitest';

import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';

describe('GastronomyUrlService', () => {
  it('centraliza home, listagem territorial e detalhe publico', () => {
    expect(GastronomyUrlService.getHomeUrl()).toBe('/gastronomia');
    expect(GastronomyUrlService.getTerritoryUrl('/br/ba/salvador/pituba')).toBe(
      '/gastronomia/ba/salvador/pituba',
    );
    expect(
      GastronomyUrlService.getCanonicalUrlFromTerritory(
        '/br/ba/salvador/rio-vermelho',
        'cafe-central',
      ),
    ).toBe('/gastronomia/ba/salvador/rio-vermelho/cafe-central');
  });

  it('rejeita slugs com separadores para evitar path injection', () => {
    expect(() =>
      GastronomyUrlService.getCanonicalUrlFromTerritory(
        '/br/ba/salvador/pituba',
        'cafe/extra',
      ),
    ).toThrow('segmento unico');
  });
});
