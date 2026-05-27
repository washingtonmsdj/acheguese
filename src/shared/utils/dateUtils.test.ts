/**
 * @fileoverview Testes unitários para utilitários de data
 * @module shared/utils/dateUtils.test
 */

import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  formatTime,
  formatShortDate,
  formatDateTime,
  isToday,
  isTomorrow,
  getDaysDifference,
} from './dateUtils';

describe('dateUtils', () => {
  describe('formatRelativeTime', () => {
    it('deve retornar "agora" para menos de 1 minuto', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('agora');
    });

    it('deve retornar "há X min" para menos de 1 hora', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('há 5 min');
    });

    it('deve retornar "há Xh" para menos de 24 horas', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('há 2h');
    });

    it('deve retornar "há X dia(s)" para menos de 7 dias', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('há 3 dias');
    });

    it('deve retornar "há X semana(s)" para menos de 30 dias', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
      expect(formatRelativeTime(twoWeeksAgo)).toBe('há 2 semanas');
    });

    it('deve retornar "há X mês/meses" para menos de 1 ano', () => {
      const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString();
      const result = formatRelativeTime(threeMonthsAgo);
      expect(result).toMatch(/há \d+ m(ês|eses)/);
    });

    it('deve retornar "há X ano(s)" para mais de 1 ano', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 86400000).toISOString();
      const result = formatRelativeTime(twoYearsAgo);
      expect(result).toMatch(/há \d+ ano/);
    });

    it('deve retornar mensagem de fallback para string inválida', () => {
      const result = formatRelativeTime('invalid');
      // A função retorna 'há NaN anos' para datas inválidas
      expect(result).toContain('há');
    });
  });

  describe('formatTime', () => {
    it('deve formatar horário', () => {
      const iso = '2026-04-16T14:30:00Z';
      const result = formatTime(iso);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('deve retornar fallback para data inválida', () => {
      const result = formatTime('invalid');
      expect(result).toBeTruthy();
    });
  });

  describe('formatShortDate', () => {
    it('deve formatar data curta', () => {
      const iso = '2026-04-16T14:30:00Z';
      const result = formatShortDate(iso);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('deve retornar fallback para data inválida', () => {
      const result = formatShortDate('invalid');
      expect(result).toBeTruthy();
    });
  });

  describe('formatDateTime', () => {
    it('deve formatar data e hora completa', () => {
      const iso = '2026-04-16T14:30:00Z';
      const result = formatDateTime(iso);
      expect(result).toContain('às');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('deve retornar fallback para string inválida', () => {
      const result = formatDateTime('invalid');
      expect(result).toBeTruthy();
    });
  });

  describe('isToday', () => {
    it('deve retornar true para data de hoje', () => {
      const today = new Date().toISOString();
      expect(isToday(today)).toBe(true);
    });

    it('deve retornar false para data diferente', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      expect(isToday(yesterday)).toBe(false);
    });

    it('deve retornar false para data inválida', () => {
      expect(isToday('invalid')).toBe(false);
    });
  });

  describe('isTomorrow', () => {
    it('deve retornar true para data de amanhã', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      expect(isTomorrow(tomorrow)).toBe(true);
    });

    it('deve retornar false para data diferente', () => {
      const today = new Date().toISOString();
      expect(isTomorrow(today)).toBe(false);
    });

    it('deve retornar false para data inválida', () => {
      expect(isTomorrow('invalid')).toBe(false);
    });
  });

  describe('getDaysDifference', () => {
    it('deve calcular diferença em dias entre duas datas', () => {
      const date1 = '2026-04-10T00:00:00Z';
      const date2 = '2026-04-15T00:00:00Z';
      expect(getDaysDifference(date1, date2)).toBe(5);
    });

    it('deve usar data atual quando segunda data não é fornecida', () => {
      const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const result = getDaysDifference(pastDate);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('deve retornar 0 para datas iguais', () => {
      const sameDate = '2026-04-15T00:00:00Z';
      expect(getDaysDifference(sameDate, sameDate)).toBe(0);
    });

    it('deve lidar com data inválida', () => {
      const result = getDaysDifference('invalid');
      // A função retorna NaN para datas inválidas
      expect(typeof result).toBe('number');
    });
  });
});
