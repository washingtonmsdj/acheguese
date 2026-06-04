import { describe, expect, it } from 'vitest';
import { buildBusinessVerticalSummary } from '../businessVerticalSummary';

describe('buildBusinessVerticalSummary', () => {
  it('exposes active verticals, primary vertical and canonical business URL for gastronomy', () => {
    const summary = buildBusinessVerticalSummary(
      {
        id: 'business-1',
        slug: 'cafe-central',
        geographic_path: '/br/ba/salvador/rio-vermelho',
      },
      { profiles: { gastronomy: true } },
    );

    expect(summary.activeVerticals).toEqual(['gastronomy']);
    expect(summary.primaryVertical).toBe('gastronomy');
    expect(summary.canonicalVerticalUrl).toBe(
      '/empresas/ba/salvador/rio-vermelho/cafe-central',
    );
  });

  it('does not expose a gastronomy URL without an active gastronomy profile', () => {
    const summary = buildBusinessVerticalSummary(
      {
        id: 'business-1',
        slug: 'cafe-central',
        geographic_path: '/br/ba/salvador/rio-vermelho',
      },
      { profiles: { gastronomy: false } },
    );

    expect(summary.activeVerticals).toEqual([]);
    expect(summary.primaryVertical).toBeNull();
    expect(summary.canonicalVerticalUrl).toBeNull();
  });

  it('exposes education as an active vertical with a territorial canonical URL', () => {
    const summary = buildBusinessVerticalSummary(
      {
        id: 'business-2',
        slug: 'escola-central',
        geographic_path: '/br/ba/salvador/brotas',
      },
      { profiles: { education: true } },
    );

    expect(summary.activeVerticals).toEqual(['education']);
    expect(summary.primaryVertical).toBe('education');
    expect(summary.canonicalVerticalUrl).toBe(
      '/educacao/ba/salvador/brotas/escola-central',
    );
    expect(summary.verticalPublicUrls.education).toBe(
      '/educacao/ba/salvador/brotas/escola-central',
    );
  });

  it('keeps gastronomy as the primary vertical when multiple verticals are active', () => {
    const summary = buildBusinessVerticalSummary(
      {
        id: 'business-3',
        slug: 'hub-completo',
        geographic_path: '/br/ba/salvador/pituba',
      },
      { profiles: { gastronomy: true, education: true } },
    );

    expect(summary.activeVerticals).toEqual(['gastronomy', 'education']);
    expect(summary.primaryVertical).toBe('gastronomy');
    expect(summary.verticalPublicUrls).toMatchObject({
      gastronomy: '/empresas/ba/salvador/pituba/hub-completo',
      education: '/educacao/ba/salvador/pituba/hub-completo',
    });
  });
});
