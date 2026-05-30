import { describe, it, expect } from 'vitest';
import {
  EDUCATION_PROFILE_STATUS,
  EDUCATION_LEAD_STATUS,
  EDUCATION_SUPPORT_LEVELS,
  UI_LIMITS,
} from '../constants';

describe('Education Constants', () => {
  describe('EDUCATION_PROFILE_STATUS', () => {
    it('should have all required statuses', () => {
      expect(EDUCATION_PROFILE_STATUS.draft).toEqual({ label: 'Rascunho', color: 'gray', variant: 'secondary' });
      expect(EDUCATION_PROFILE_STATUS.published).toEqual({ label: 'Publicado', color: 'green', variant: 'default' });
      expect(EDUCATION_PROFILE_STATUS.paused).toEqual({ label: 'Pausado', color: 'yellow', variant: 'destructive' });
    });

    it('should have correct label and color for each status', () => {
      const statuses = Object.keys(EDUCATION_PROFILE_STATUS);
      expect(statuses).toHaveLength(3);
      statuses.forEach((key) => {
        expect(EDUCATION_PROFILE_STATUS[key as keyof typeof EDUCATION_PROFILE_STATUS]).toHaveProperty('label');
        expect(EDUCATION_PROFILE_STATUS[key as keyof typeof EDUCATION_PROFILE_STATUS]).toHaveProperty('color');
        expect(EDUCATION_PROFILE_STATUS[key as keyof typeof EDUCATION_PROFILE_STATUS]).toHaveProperty('variant');
      });
    });
  });

  describe('EDUCATION_LEAD_STATUS', () => {
    it('should have all required pipeline statuses in correct order', () => {
      expect(EDUCATION_LEAD_STATUS.new).toEqual({ label: 'Novo', color: 'blue', order: 1, variant: 'default' });
      expect(EDUCATION_LEAD_STATUS.contacted).toEqual({ label: 'Contactado', color: 'purple', order: 2, variant: 'secondary' });
      expect(EDUCATION_LEAD_STATUS.visit_scheduled).toEqual({ label: 'Visita Agendada', color: 'orange', order: 3, variant: 'outline' });
      expect(EDUCATION_LEAD_STATUS.proposal_sent).toEqual({ label: 'Proposta Enviada', color: 'cyan', order: 4, variant: 'outline' });
      expect(EDUCATION_LEAD_STATUS.enrolled).toEqual({ label: 'Matriculado', color: 'green', order: 5, variant: 'default' });
      expect(EDUCATION_LEAD_STATUS.lost).toEqual({ label: 'Perdido', color: 'red', order: 6, variant: 'destructive' });
    });

    it('should have ascending order values', () => {
      const statuses = Object.values(EDUCATION_LEAD_STATUS);
      for (let i = 1; i < statuses.length; i++) {
        const current = statuses.at(i);
        const previous = statuses.at(i - 1);
        expect(current).toBeDefined();
        expect(previous).toBeDefined();
        expect(current?.order).toBeGreaterThan(previous?.order ?? -1);
      }
    });
  });

  describe('EDUCATION_SUPPORT_LEVELS', () => {
    it('should have all support levels', () => {
      expect(EDUCATION_SUPPORT_LEVELS.FULL_ENABLED).toBe('full_enabled');
      expect(EDUCATION_SUPPORT_LEVELS.BASIC_ENABLED).toBe('basic_enabled');
      expect(EDUCATION_SUPPORT_LEVELS.BETA).toBe('beta');
      expect(EDUCATION_SUPPORT_LEVELS.PLANNED).toBe('planned');
    });
  });

  describe('UI_LIMITS', () => {
    it('should have reasonable limits', () => {
      expect(UI_LIMITS.MAX_PROGRAMS_PER_PROFILE).toBeGreaterThan(0);
      expect(UI_LIMITS.MAX_LEADS_PER_PAGE).toBeGreaterThan(0);
      expect(UI_LIMITS.MAX_EVENTS_PER_PROFILE).toBeGreaterThan(0);
      expect(UI_LIMITS.MAX_SUMMARY_LENGTH).toBeGreaterThan(0);
      expect(UI_LIMITS.MAX_PROGRAM_NAME_LENGTH).toBeGreaterThan(0);
      expect(UI_LIMITS.MAX_NOTE_LENGTH).toBeGreaterThan(0);
    });

    it('should have MAX_LEADS_PER_PAGE as 25', () => {
      expect(UI_LIMITS.MAX_LEADS_PER_PAGE).toBe(25);
    });
  });
});
