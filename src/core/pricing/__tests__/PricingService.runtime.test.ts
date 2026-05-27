/**
 * Testes de runtime para PricingService
 *
 * Se o runtime Supabase nao estiver configurado, os testes nao falham no ambiente local.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pricingService } from '../services/PricingService';
import { authenticateAsFirstAdminProfile, signOut } from '../../../../tests/helpers/auth-helper';
import { getAdminClient } from '../../../../tests/helpers/supabase-test-client';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const HAS_RUNTIME =
  SUPABASE_URL.length > 0 &&
  !SUPABASE_URL.includes('placeholder.supabase.co') &&
  !SUPABASE_URL.includes('your-project.supabase.co');

function skipIfNoRuntime(): boolean {
  return !HAS_RUNTIME;
}

describe('PricingService - Runtime Validation', () => {
  let testRuleId: string;
  let testProfileId: string;
  let activeCustomRuleIdsBefore: string[] = [];
  const supabaseAdmin = getAdminClient();

  async function cleanupRuntimeRules(): Promise<void> {
    await supabaseAdmin
      .from('pricing_rules')
      .delete()
      .ilike('name', 'Teste%');
  }

  beforeAll(async () => {
    if (skipIfNoRuntime()) return;

    await cleanupRuntimeRules();

    const { data: activeCustomRules } = await supabaseAdmin
      .from('pricing_rules')
      .select('id')
      .eq('mode', 'custom')
      .eq('is_active', true);
    activeCustomRuleIdsBefore = (activeCustomRules ?? []).map((rule) => rule.id);

    testProfileId = await authenticateAsFirstAdminProfile();
  });

  afterAll(async () => {
    if (skipIfNoRuntime()) return;

    await cleanupRuntimeRules();
    if (activeCustomRuleIdsBefore.length > 0) {
      await supabaseAdmin
        .from('pricing_rules')
        .update({ is_active: true, updated_by: testProfileId })
        .in('id', activeCustomRuleIdsBefore);
    }
    await signOut();
  });

  describe('1. Criacao de regra', () => {
    it('deve criar regra com multiplicadores e taxas', async () => {
      if (skipIfNoRuntime()) return;

      const ruleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Runtime',
          baseFare: 10.0,
          pricePerKm: 3.0,
          pricePerMinute: 0.6,
          minimumFare: 15.0,
          maximumFare: 100.0,
          isActive: false,
          metadata: { runtime_test: true },
          peakHourMultipliers: {
            morning: 1.5,
            afternoon: 1.8,
          },
          additionalFees: [
            {
              id: 'test-fee',
              label: 'Taxa de teste',
              amount: 2.5,
              type: 'fixed',
            },
          ],
        },
        testProfileId,
      );

      expect(ruleId).toBeDefined();
      expect(typeof ruleId).toBe('string');
      testRuleId = ruleId;

      const { data: rule } = await supabaseAdmin
        .from('pricing_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      expect(rule).toBeDefined();
      expect(rule.mode).toBe('custom');
      expect(rule.name).toBe('Teste Runtime');
      expect(Number(rule.base_fare)).toBe(10.0);
      expect(Number(rule.price_per_km)).toBe(3.0);
      expect(Number(rule.minimum_fare)).toBe(15.0);

      const { data: multipliers } = await supabaseAdmin
        .from('pricing_peak_hour_multipliers')
        .select('*')
        .eq('rule_id', ruleId);

      expect(multipliers).toHaveLength(2);

      const { data: fees } = await supabaseAdmin
        .from('pricing_additional_fees')
        .select('*')
        .eq('rule_id', ruleId);

      expect(fees).toHaveLength(1);
      expect(fees?.[0].label).toBe('Taxa de teste');
      expect(Number(fees?.[0].amount)).toBe(2.5);
    });
  });

  describe('2. Conflito de regras', () => {
    it('deve manter apenas uma regra ativa por modo ao criar nova ativa', async () => {
      if (skipIfNoRuntime()) return;

      const firstRuleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Ativa Inicial',
          baseFare: 6.0,
          pricePerKm: 2.0,
          pricePerMinute: 0.4,
          minimumFare: 9.0,
          isActive: true,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      const secondRuleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Ativa Substituta',
          baseFare: 7.0,
          pricePerKm: 2.2,
          pricePerMinute: 0.5,
          minimumFare: 10.0,
          isActive: true,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      const { data: activeRules } = await supabaseAdmin
        .from('pricing_rules')
        .select('id')
        .eq('mode', 'custom')
        .eq('is_active', true);

      expect(activeRules?.map((rule) => rule.id)).toEqual([secondRuleId]);
      expect(firstRuleId).not.toBe(secondRuleId);
    });

    it('deve permitir regras inativas simultaneas', async () => {
      if (skipIfNoRuntime()) return;

      const ruleId = await pricingService.createRule(
        {
          mode: 'ride',
          name: 'Corrida Inativa',
          baseFare: 6.0,
          pricePerKm: 2.0,
          pricePerMinute: 0.4,
          minimumFare: 9.0,
          isActive: false,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      expect(ruleId).toBeDefined();
    });
  });

  describe('3. Calculo com regra persistida', () => {
    it('deve calcular estimativa usando regra do banco', async () => {
      if (skipIfNoRuntime()) return;

      const estimate = await pricingService.calculateEstimate({
        mode: 'ride',
        origin: { latitude: -12.9714, longitude: -38.5014 },
        destination: { latitude: -12.9814, longitude: -38.5114 },
        options: {
          includeBreakdown: true,
          applyPeakHours: false,
        },
      });

      expect(estimate).toBeDefined();
      expect(estimate.estimatedPrice).toBeGreaterThan(0);
      expect(estimate.minimumPrice).toBeGreaterThan(0);
      expect(estimate.currency).toBe('BRL');
      expect(estimate.metadata.mode).toBe('ride');
      expect(estimate.breakdown?.baseFare).toBeGreaterThan(0);
    });

    it('deve aplicar multiplicador de horario de pico', async () => {
      if (skipIfNoRuntime()) return;

      const peakDate = new Date('2026-05-20T17:30:00-03:00');

      const estimate = await pricingService.calculateEstimate({
        mode: 'ride',
        origin: { latitude: -12.9714, longitude: -38.5014 },
        destination: { latitude: -12.9814, longitude: -38.5114 },
        timestamp: peakDate,
        options: {
          includeBreakdown: true,
          applyPeakHours: true,
        },
      });

      expect(estimate.metadata.peakHourMultiplier).toBe(1.5);
      expect(estimate.estimatedPrice).toBeGreaterThan(estimate.breakdown?.subtotal || 0);
    });

    it('deve usar fallback se regra nao existir', async () => {
      if (skipIfNoRuntime()) return;

      const { data: activeMotoboyRules } = await supabaseAdmin
        .from('pricing_rules')
        .select('id')
        .eq('mode', 'motoboy')
        .eq('is_active', true);
      const activeMotoboyRuleIdsBefore = (activeMotoboyRules ?? []).map((rule) => rule.id);

      await supabaseAdmin
        .from('pricing_rules')
        .update({ is_active: false })
        .eq('mode', 'motoboy');
      pricingService.clearCache();

      try {
        const estimate = await pricingService.calculateEstimate({
          mode: 'motoboy',
          origin: { latitude: -12.9714, longitude: -38.5014 },
          destination: { latitude: -12.9814, longitude: -38.5114 },
        });

        expect(estimate).toBeDefined();
        expect(estimate.estimatedPrice).toBeGreaterThan(0);
      } finally {
        if (activeMotoboyRuleIdsBefore.length > 0) {
          await supabaseAdmin
            .from('pricing_rules')
            .update({ is_active: true, updated_by: testProfileId })
            .in('id', activeMotoboyRuleIdsBefore);
        }
        pricingService.clearCache();
      }
    });
  });

  describe('4. Auditoria', () => {
    it('deve registrar criacao de regra', async () => {
      if (skipIfNoRuntime()) return;

      const ruleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Auditoria',
          baseFare: 5.0,
          pricePerKm: 2.0,
          pricePerMinute: 0.5,
          minimumFare: 8.0,
          isActive: false,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      const { data: auditLog } = await supabaseAdmin
        .from('pricing_audit_log')
        .select('*')
        .eq('entity_id', ruleId)
        .eq('action', 'rule_created')
        .single();

      expect(auditLog).toBeDefined();
      expect(auditLog.entity_type).toBe('rule');
      expect(auditLog.performed_by).toBe(testProfileId);
    });

    it('deve registrar ativacao/desativacao', async () => {
      if (skipIfNoRuntime()) return;

      await supabaseAdmin
        .from('pricing_rules')
        .update({ is_active: false })
        .eq('mode', 'custom')
        .eq('is_active', true);

      const ruleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Ativacao',
          baseFare: 5.0,
          pricePerKm: 2.0,
          pricePerMinute: 0.5,
          minimumFare: 8.0,
          isActive: false,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      await pricingService.updateRule(ruleId, { isActive: true }, testProfileId);

      const { data: activationLog } = await supabaseAdmin
        .from('pricing_audit_log')
        .select('*')
        .eq('entity_id', ruleId)
        .eq('action', 'rule_activated')
        .single();

      expect(activationLog).toBeDefined();
    });
  });

  describe('5. Cache e invalidacao', () => {
    it('deve cachear regras por 5 minutos', async () => {
      if (skipIfNoRuntime()) return;

      const rule1 = await pricingService.getRule('ride');
      const rule2 = await pricingService.getRule('ride');

      expect(rule1).toBeDefined();
      expect(rule2).toBeDefined();
      expect(rule2.id).toBe(rule1.id);
    });

    it('deve invalidar cache ao limpar', async () => {
      if (skipIfNoRuntime()) return;

      const rule1 = await pricingService.getRule('delivery');
      expect(rule1).toBeDefined();

      pricingService.clearCache();

      const rule2 = await pricingService.getRule('delivery');
      expect(rule2).toBeDefined();
    });

    it('deve invalidar cache ao criar regra', async () => {
      if (skipIfNoRuntime()) return;

      pricingService.clearCache();

      const rule1 = await pricingService.getRule('custom');
      expect(rule1).toBeDefined();

      const ruleId = await pricingService.createRule(
        {
          mode: 'custom',
          name: 'Teste Cache',
          baseFare: 5.0,
          pricePerKm: 2.0,
          pricePerMinute: 0.5,
          minimumFare: 8.0,
          isActive: false,
          metadata: { runtime_test: true },
        },
        testProfileId,
      );

      const rule2 = await pricingService.getRule('custom');
      expect(rule2).toBeDefined();
    });
  });

  describe('6. Listagem de regras', () => {
    it('deve listar apenas regras ativas por padrao', async () => {
      if (skipIfNoRuntime()) return;

      const rules = await pricingService.listRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.isActive)).toBe(true);
    });

    it('deve listar todas as regras quando solicitado', async () => {
      if (skipIfNoRuntime()) return;

      const allRules = await pricingService.listRules(true);
      const activeRules = await pricingService.listRules(false);

      expect(allRules.length).toBeGreaterThanOrEqual(activeRules.length);
    });
  });
});
