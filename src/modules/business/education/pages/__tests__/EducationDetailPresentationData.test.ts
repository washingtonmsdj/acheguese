import { describe, expect, it } from 'vitest';
import { formatPrice } from '../EducationDetailPresentationData';

describe('EducationDetailPresentationData', () => {
  it('preserves zero as a valid monetary value', () => {
    expect(formatPrice(0)).toBe(
      (0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    );
  });

  it('keeps missing price distinct from zero', () => {
    expect(formatPrice(null)).toBeNull();
  });
});
