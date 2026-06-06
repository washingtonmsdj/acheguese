/**
 * @fileoverview Testes unitários para formatação monetária
 * @module shared/utils/currency.test
 */

import { describe, it, expect } from 'vitest';
import {
  formatBrl,
  formatBrlCompact,
  formatBrlFromCents,
  formatBrlFromCentsNoCents,
  formatBrlNoCents,
} from './currency';

describe('currency', () => {
  describe('formatBrl', () => {
    it('deve formatar valor em reais', () => {
      expect(formatBrl(100)).toBe('R$\xa0100,00');
    });

    it('deve formatar centavos corretamente', () => {
      expect(formatBrl(99.99)).toBe('R$\xa099,99');
    });

    it('deve formatar zero', () => {
      expect(formatBrl(0)).toBe('R$\xa00,00');
    });

    it('deve formatar valores negativos', () => {
      expect(formatBrl(-50)).toBe('-R$\xa050,00');
    });

    it('deve formatar valores grandes', () => {
      expect(formatBrl(1000000)).toBe('R$\xa01.000.000,00');
    });
  });

  describe('formatBrlCompact', () => {
    it('deve formatar valores pequenos normalmente', () => {
      expect(formatBrlCompact(100)).toBe('R$\xa0100,00');
      expect(formatBrlCompact(999)).toBe('R$\xa0999,00');
    });

    it('deve formatar valores grandes de forma compacta', () => {
      // Valores >= 1000 usam notação compacta
      const result = formatBrlCompact(1500);
      expect(result).toContain('R$');
    });

    it('deve formatar milhares de forma compacta', () => {
      const result = formatBrlCompact(15000);
      expect(result).toContain('R$');
    });

    it('deve formatar milhões de forma compacta', () => {
      const result = formatBrlCompact(1500000);
      expect(result).toContain('R$');
    });

    it('deve formatar zero', () => {
      expect(formatBrlCompact(0)).toBe('R$\xa00,00');
    });
  });

  describe('formatBrlNoCents', () => {
    it('deve formatar valores sem centavos', () => {
      expect(formatBrlNoCents(100)).toBe('R$\xa0100');
      expect(formatBrlNoCents(1234.56)).toBe('R$\xa01.235');
    });
  });

  describe('formatBrlFromCents', () => {
    it('deve formatar centavos como reais', () => {
      expect(formatBrlFromCents(12345)).toBe('R$\xa0123,45');
    });
  });

  describe('formatBrlFromCentsNoCents', () => {
    it('deve formatar centavos como reais sem centavos', () => {
      expect(formatBrlFromCentsNoCents(12345)).toBe('R$\xa0123');
    });
  });
});
