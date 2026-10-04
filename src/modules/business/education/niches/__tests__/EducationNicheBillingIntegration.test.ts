/**
 * EducationNicheBillingIntegration - Testes
 *
 * Testes unitários para o serviço de integração nicho + billing.
 * Cobre: capability resolution, limites operacionais, validações.
 */

import { describe, it, expect } from 'vitest';
import { EducationNicheBillingIntegration } from '../services/EducationNicheBillingIntegration';
import { PlanTier } from '@/core/billing/types';
import type { EducationNicheCapability } from '../types';

const TEST_BUSINESS_ID = '00000000-0000-4000-8000-000000000002';

describe('EducationNicheBillingIntegration', () => {
  const mockContext = {
    nicheKey: 'regular_school',
    planTier: PlanTier.PRO,
    businessId: TEST_BUSINESS_ID,
  };

  describe('resolveEffectiveCapability', () => {
    it('deve permitir capability quando nicho E plano permitem', () => {
      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        mockContext,
        'basic_programs_catalog'
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('allowed');
      expect(result.nicheHas).toBe(true);
      expect(result.planAllows).toBe(true);
    });

    it('deve negar capability quando nicho não permite', () => {
      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        mockContext,
        'attendance_tracking'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('niche_denied');
      expect(result.nicheHas).toBe(false);
    });

    it('deve negar capability premium quando plano é FREE', () => {
      const freeContext = {
        ...mockContext,
        planTier: PlanTier.FREE,
        nicheKey: 'daycare'
      };
      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        freeContext,
        'trial_class_booking'
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('plan_denied');
      expect(result.planAllows).toBe(false);
    });

    it('deve permitir capability básica em plano FREE', () => {
      const freeContext = { ...mockContext, planTier: PlanTier.FREE };
      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        freeContext,
        'lead_capture'
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('allowed');
    });

    it('deve resolver analytics básico pela autoridade de analytics', () => {
      const freeContext = { ...mockContext, planTier: PlanTier.FREE };
      const result = EducationNicheBillingIntegration.resolveEffectiveCapability(
        freeContext,
        'analytics_basic'
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('allowed');
      expect(result.nicheHas).toBe(true);
      expect(result.planAllows).toBe(true);
    });
  });

  describe('resolveMultipleCapabilities', () => {
    it('deve resolver múltiplas capabilities de uma vez', () => {
      const capabilities: EducationNicheCapability[] = [
        'basic_programs_catalog',
        'lead_capture',
        'events_public',
      ];

      const results = EducationNicheBillingIntegration.resolveMultipleCapabilities(
        mockContext,
        capabilities
      );

      expect(results['basic_programs_catalog'].allowed).toBe(true);
      expect(results['lead_capture'].allowed).toBe(true);
      expect(results['events_public'].allowed).toBe(true);
    });
  });

  describe('planAllowsEducationCapability', () => {
    it('deve permitir capabilities básicas em todos os planos', () => {
      const basicCapabilities: EducationNicheCapability[] = [
        'basic_programs_catalog',
        'lead_capture',
        'lead_pipeline',
        'whatsapp_cta',
        'analytics_basic',
      ];

      for (const capability of basicCapabilities) {
        expect(
          EducationNicheBillingIntegration.planAllowsEducationCapability(PlanTier.FREE, capability)
        ).toBe(true);
        expect(
          EducationNicheBillingIntegration.planAllowsEducationCapability(PlanTier.PRO, capability)
        ).toBe(true);
      }
    });

    it('deve negar capabilities premium em plano FREE', () => {
      const premiumCapabilities: EducationNicheCapability[] = [
        'document_upload_pre_enrollment',
        'guardian_portal_basic',
        'attendance_tracking',
        'gradebook',
      ];

      for (const capability of premiumCapabilities) {
        expect(
          EducationNicheBillingIntegration.planAllowsEducationCapability(PlanTier.FREE, capability)
        ).toBe(false);
      }
    });

    it('deve permitir todas capabilities em planos pagos', () => {
      const allCapabilities: EducationNicheCapability[] = [
        'document_upload_pre_enrollment',
        'guardian_portal_basic',
        'attendance_tracking',
        'gradebook',
        'transport_tracking',
        'payment_installments',
      ];

      for (const capability of allCapabilities) {
        expect(
          EducationNicheBillingIntegration.planAllowsEducationCapability(PlanTier.PRO, capability)
        ).toBe(true);
        expect(
          EducationNicheBillingIntegration.planAllowsEducationCapability(PlanTier.DELIVERY, capability)
        ).toBe(true);
      }
    });
  });

  describe('isPremiumCapability', () => {
    it('deve identificar capabilities premium corretamente', () => {
      expect(
        EducationNicheBillingIntegration.isPremiumCapability('document_upload_pre_enrollment')
      ).toBe(true);
      expect(
        EducationNicheBillingIntegration.isPremiumCapability('attendance_tracking')
      ).toBe(true);
    });

    it('deve identificar capabilities básicas corretamente', () => {
      expect(
        EducationNicheBillingIntegration.isPremiumCapability('lead_capture')
      ).toBe(false);
      expect(
        EducationNicheBillingIntegration.isPremiumCapability('basic_programs_catalog')
      ).toBe(false);
      expect(
        EducationNicheBillingIntegration.isPremiumCapability('analytics_basic')
      ).toBe(false);
    });
  });

  describe('canCreateProgram', () => {
    it('deve permitir criar programa quando abaixo do limite', () => {
      const result = EducationNicheBillingIntegration.canCreateProgram(mockContext, 5);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('deve negar quando limite do nicho atingido', () => {
      const result = EducationNicheBillingIntegration.canCreateProgram(mockContext, 20);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limite');
    });
  });

  describe('canCreateEvent', () => {
    it('deve permitir criar evento quando abaixo do limite', () => {
      const result = EducationNicheBillingIntegration.canCreateEvent(mockContext, 5);
      expect(result.allowed).toBe(true);
    });

    it('deve negar quando limite de eventos atingido', () => {
      const result = EducationNicheBillingIntegration.canCreateEvent(mockContext, 10);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limite');
    });
  });

  describe('canReceiveLead', () => {
    it('deve permitir receber lead quando abaixo do limite mensal', () => {
      const result = EducationNicheBillingIntegration.canReceiveLead(mockContext, 100);
      expect(result.allowed).toBe(true);
    });

    it('deve negar quando limite mensal atingido', () => {
      const result = EducationNicheBillingIntegration.canReceiveLead(mockContext, 500);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limite mensal');
    });
  });

  describe('getOperationalLimits', () => {
    it('deve retornar limites operacionais completos', () => {
      const usage = {
        programCount: 5,
        eventCount: 3,
        leadsThisMonth: 100,
      };

      const limits = EducationNicheBillingIntegration.getOperationalLimits(mockContext, usage);

      expect(limits.programs.max).toBe(20);
      expect(limits.programs.current).toBe(5);
      expect(limits.programs.canCreate).toBe(true);

      expect(limits.events.max).toBe(10);
      expect(limits.events.current).toBe(3);

      expect(limits.leads.max).toBe(500);
      expect(limits.leads.current).toBe(100);
    });

    it('deve indicar quando não pode criar mais programas', () => {
      const usage = {
        programCount: 20,
        eventCount: 0,
        leadsThisMonth: 0,
      };

      const limits = EducationNicheBillingIntegration.getOperationalLimits(mockContext, usage);

      expect(limits.programs.canCreate).toBe(false);
    });
  });

  describe('validateAction', () => {
    it('deve validar view_analytics com sucesso quando permitido', () => {
      const result = EducationNicheBillingIntegration.validateAction(
        mockContext,
        'view_analytics'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve falhar view_analytics quando nicho não permite', () => {
      const invalidNicheContext = { ...mockContext, nicheKey: 'nonexistent_niche' };
      const result = EducationNicheBillingIntegration.validateAction(
        invalidNicheContext,
        'view_analytics'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve validar export_data considerando plano', () => {
      const freeContext = { ...mockContext, planTier: PlanTier.FREE };
      const result = EducationNicheBillingIntegration.validateAction(
        freeContext,
        'export_data'
      );

      expect(result.isValid).toBe(false);
    });
  });

  describe('getUpgradeMessage', () => {
    it('deve retornar mensagem apropriada para niche_denied', () => {
      const message = EducationNicheBillingIntegration.getUpgradeMessage(
        'niche_denied',
        'attendance_tracking'
      );

      expect(message).toContain('não está disponível');
      expect(message).toContain('attendance_tracking');
    });

    it('deve retornar mensagem apropriada para plan_denied', () => {
      const message = EducationNicheBillingIntegration.getUpgradeMessage(
        'plan_denied',
        'document_upload_pre_enrollment'
      );

      expect(message).toContain('plano pago');
      expect(message).toContain('upgrade');
    });

    it('deve retornar mensagem apropriada para inactive', () => {
      const message = EducationNicheBillingIntegration.getUpgradeMessage(
        'inactive',
        'some_feature'
      );

      expect(message).toContain('temporariamente indisponível');
    });

    it('deve retornar string vazia para allowed', () => {
      const message = EducationNicheBillingIntegration.getUpgradeMessage(
        'allowed',
        'any_feature'
      );

      expect(message).toBe('');
    });
  });

  describe('diferentes nichos', () => {
    it('deve retornar limites diferentes para daycare vs regular_school', () => {
      const daycareContext = { ...mockContext, nicheKey: 'daycare' };
      const schoolContext = { ...mockContext, nicheKey: 'regular_school' };

      const daycareLimits = EducationNicheBillingIntegration.getOperationalLimits(daycareContext, {
        programCount: 0,
        eventCount: 0,
        leadsThisMonth: 0,
      });

      const schoolLimits = EducationNicheBillingIntegration.getOperationalLimits(schoolContext, {
        programCount: 0,
        eventCount: 0,
        leadsThisMonth: 0,
      });

      expect(daycareLimits.programs.max).toBe(15);
      expect(schoolLimits.programs.max).toBe(20);
      expect(daycareLimits.leads.max).toBe(300);
      expect(schoolLimits.leads.max).toBe(500);
    });
  });
});
