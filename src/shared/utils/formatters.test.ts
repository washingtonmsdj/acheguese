/**
 * @fileoverview Testes unitários para utilitários de formatação
 * @module shared/utils/formatters.test
 */

import { describe, it, expect } from 'vitest';
import {
  getInitials,
  getRelativeTime,
  formatNumber,
  formatCompactMetricNumber,
  formatMetric,
  truncateText,
} from './formatters';

describe('formatters', () => {
  describe('getInitials', () => {
    it('deve retornar iniciais do nome', () => {
      expect(getInitials('João Silva')).toBe('JS');
      expect(getInitials('Maria')).toBe('M');
    });

    it('deve retornar "U" para nome vazio ou null', () => {
      expect(getInitials('')).toBe('U');
      expect(getInitials(null)).toBe('U');
      expect(getInitials(undefined)).toBe('U');
    });

    it('deve retornar no máximo 2 iniciais', () => {
      expect(getInitials('João Carlos Silva Santos')).toBe('JC');
    });

    it('deve retornar iniciais em maiúsculo', () => {
      expect(getInitials('joão silva')).toBe('JS');
    });
  });

  describe('getRelativeTime', () => {
    it('deve retornar "agora" para menos de 1 minuto', () => {
      const now = new Date().toISOString();
      expect(getRelativeTime(now)).toBe('agora');
    });

    it('deve retornar minutos para menos de 1 hora', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(getRelativeTime(fiveMinutesAgo)).toBe('há 5min');
    });

    it('deve retornar horas para menos de 24 horas', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(getRelativeTime(twoHoursAgo)).toBe('há 2h');
    });

    it('deve retornar dias para menos de 7 dias', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      expect(getRelativeTime(threeDaysAgo)).toBe('há 3d');
    });

    it('deve retornar data formatada para mais de 7 dias', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
      const result = getRelativeTime(tenDaysAgo);
      expect(result).toMatch(/\d{2}\s[a-z]+/);
    });
  });

  describe('formatNumber', () => {
    it('deve formatar número normal', () => {
      expect(formatNumber(999)).toBe('999');
    });

    it('deve formatar número em milhares', () => {
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1000)).toBe('1.0K');
    });

    it('deve formatar número em milhões', () => {
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(1000000)).toBe('1.0M');
    });

    it('deve lidar com zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCompactMetricNumber', () => {
    it('deve formatar métricas compactas para UI territorial', () => {
      expect(formatCompactMetricNumber(999)).toBe('999');
      expect(formatCompactMetricNumber(1500)).toBe('2k+');
      expect(formatCompactMetricNumber(1500000)).toBe('1.5M');
    });
  });

  describe('formatMetric', () => {
    it('deve retornar "-" para métrica ausente ou inválida', () => {
      expect(formatMetric(null)).toBe('-');
      expect(formatMetric(undefined)).toBe('-');
      expect(formatMetric(Number.NaN)).toBe('-');
    });

    it('deve formatar métrica numérica válida', () => {
      expect(formatMetric(1000)).toBe('1k+');
    });
  });

  describe('truncateText', () => {
    it('deve retornar texto completo se estiver dentro do limite', () => {
      expect(truncateText('short', 10)).toBe('short');
    });

    it('deve truncar texto se exceder limite', () => {
      expect(truncateText('this is a long text', 10)).toBe('this is a ...');
    });

    it('deve lidar com texto vazio', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('deve respeitar limite exato', () => {
      const text = 'exactly ten';
      expect(truncateText(text, 11)).toBe(text);
      expect(truncateText(text, 10)).toBe('exactly te...');
    });
  });
});
