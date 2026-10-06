import { describe, it, expect } from 'vitest';
import {
  EDUCATION_PROFILE_STATUS,
  EDUCATION_LEAD_STATUS,
  EDUCATION_SUPPORT_LEVELS,
  EDUCATION_LEVEL_OPTIONS,
  EDUCATION_PROGRAM_MODALITY_OPTIONS,
  EDUCATION_PROGRAM_SHIFT_OPTIONS,
  getEducationLevelLabel,
  getEducationProgramModalityLabel,
  getEducationProgramShiftLabel,

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

  describe('education level labels', () => {
    it('maps canonical education level codes to pt-BR labels', () => {
      expect(getEducationLevelLabel('early_childhood')).toBe('Educação Infantil');
      expect(getEducationLevelLabel('elementary_2')).toBe(
        'Ensino Fundamental - Anos Finais',
      );
      expect(getEducationLevelLabel('youth_adult_education')).toBe(
        'EJA - Educação de Jovens e Adultos',
      );
      expect(getEducationLevelLabel('unknown_level')).toBeNull();
    });

    it('keeps setup options derived from the same owner', () => {
      expect(EDUCATION_LEVEL_OPTIONS).toContainEqual({
        key: 'high_school',
        label: 'Ensino Médio',
      });
    });
  });

  describe('program presentation labels', () => {
    it('maps known technical values to pt-BR labels without inventing missing data', () => {
      expect(getEducationProgramModalityLabel('in_person')).toBe('Presencial');
      expect(getEducationProgramModalityLabel('hybrid')).toBe('Híbrido');
      expect(getEducationProgramModalityLabel(null)).toBeNull();

      expect(getEducationProgramShiftLabel('morning')).toBe('Manhã');
      expect(getEducationProgramShiftLabel('full_day')).toBe('Integral');
      expect(getEducationProgramShiftLabel(null)).toBeNull();
    });

    it('keeps selector options aligned with the same label owners', () => {
      expect(EDUCATION_PROGRAM_MODALITY_OPTIONS).toContainEqual({
        value: 'online',
        label: 'Online',
      });
      expect(EDUCATION_PROGRAM_SHIFT_OPTIONS).toContainEqual({
        value: 'evening',
        label: 'Noite',
      });
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


});
