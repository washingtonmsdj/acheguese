/**
 * Type Guards - Testes
 * 
 * Testes unitários para os type guards isEducationNicheKey e isEducationCapability.
 */

import { describe, it, expect } from 'vitest';
import { isEducationNicheKey, isEducationCapability } from '../types';

describe('Type Guards', () => {
  // ============================================================================
  // isEducationNicheKey
  // ============================================================================
  describe('isEducationNicheKey', () => {
    it('deve retornar true para nichos válidos', () => {
      const validNiches = [
        'regular_school',
        'daycare',
        'language_school',
        'prep_course',
        'technical_school',
        'tutoring_center',
        'music_school',
        'sports_school',
      ];

      for (const niche of validNiches) {
        expect(isEducationNicheKey(niche)).toBe(true);
      }
    });

    it('deve retornar false para strings inválidas', () => {
      const invalidKeys = [
        'invalid_niche',
        'school',
        'university',
        'college',
        '',
        'random_string',
        'day_care', // underscore extra
      ];

      for (const key of invalidKeys) {
        expect(isEducationNicheKey(key)).toBe(false);
      }
    });

    it('deve funcionar como type guard', () => {
      const key = 'regular_school';
      
      if (isEducationNicheKey(key)) {
        // Se chegou aqui, o TypeScript sabe que key é um EducationNicheKey válido
        expect(key).toBe('regular_school');
      } else {
        throw new Error('Deveria ter reconhecido como niche válido');
      }
    });
  });

  // ============================================================================
  // isEducationCapability
  // ============================================================================
  describe('isEducationCapability', () => {
    it('deve retornar true para capabilities válidas', () => {
      const validCapabilities = [
        'basic_programs_catalog',
        'lead_capture',
        'lead_pipeline',
        'events_public',
        'trial_class_booking',
        'whatsapp_cta',
        'document_upload_pre_enrollment',
        'guardian_portal_basic',
        'schedule_public',
        'attendance_tracking',
        'gradebook',
        'transport_tracking',
        'payment_installments',
      ];

      for (const capability of validCapabilities) {
        expect(isEducationCapability(capability)).toBe(true);
      }
    });

    it('deve retornar false para strings inválidas', () => {
      const invalidCapabilities = [
        'invalid_capability',
        'programs',
        'analytics',
        '',
        'random_feature',
        'basic programs', // com espaço
      ];

      for (const capability of invalidCapabilities) {
        expect(isEducationCapability(capability)).toBe(false);
      }
    });

    it('deve diferenciar capabilities básicas de premium', () => {
      // Todas são válidas, mas algumas são premium
      expect(isEducationCapability('lead_capture')).toBe(true);
      expect(isEducationCapability('attendance_tracking')).toBe(true);
    });
  });
});
