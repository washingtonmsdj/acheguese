/**
 * CatalogService - Contract Tests
 *
 * Valida contratos de API do CatalogService com fixture local determinística:
 * - planos base horizontais podem ter vertical = null;
 * - pacotes/addons verticais respeitam o contexto solicitado;
 * - somente catálogo published participa do runtime;
 * - versão publicada aceita o formato canônico vN.N.N.
 *
 * A disponibilidade do Supabase não faz parte deste contrato unitário; probes e
 * testes de integração remotos vivem nos gates dedicados de produção.
 */

import { describe, it, expect, vi } from 'vitest';

const { from } = vi.hoisted(() => {
  const publishedVersion = {
    version_code: '1.2.3',
    status: 'published',
  };
  const now = '2026-09-26T00:00:00.000Z';
  const rows = [
    {
      id: '00000000-0000-4000-8000-000000000101',
      item_code: 'base-free',
      item_name: 'Plano Free',
      item_type: 'base_plan',
      plan_tier: 'free',
      entity_family: 'company',
      vertical: null,
      pricing_model: 'free',
      description: 'Plano horizontal gratuito',
      features: ['public-profile'],
      display_order: 1,
      is_featured: false,
      created_at: now,
      updated_at: now,
      commercial_catalog_version: publishedVersion,
      catalog_entitlement_policy: null,
      catalog_pricing_policy: null,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      item_code: 'gastronomy-package',
      item_name: 'Pacote Gastronomia',
      item_type: 'vertical_package',
      plan_tier: 'pro',
      entity_family: 'company',
      vertical: 'gastronomy',
      pricing_model: 'subscription',
      description: 'Pacote da vertical de gastronomia',
      features: ['advanced-menu'],
      display_order: 2,
      is_featured: true,
      created_at: now,
      updated_at: now,
      commercial_catalog_version: publishedVersion,
      catalog_entitlement_policy: null,
      catalog_pricing_policy: null,
    },
    {
      id: '00000000-0000-4000-8000-000000000103',
      item_code: 'retail-addon',
      item_name: 'Addon Varejo',
      item_type: 'addon',
      plan_tier: 'pro',
      entity_family: 'company',
      vertical: 'retail',
      pricing_model: 'transactional',
      description: 'Fixture de outra vertical que deve ser filtrada',
      features: ['retail-only'],
      display_order: 3,
      is_featured: false,
      created_at: now,
      updated_at: now,
      commercial_catalog_version: publishedVersion,
      catalog_entitlement_policy: null,
      catalog_pricing_policy: null,
    },
  ];
  const result = { data: rows, error: null };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.then.mockImplementation((onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected),
  );

  return {
    from: vi.fn(() => query),
  };
});

vi.mock('@/integrations/supabase', () => ({
  supabase: { from },
}));

import { CatalogService } from '@/core/billing/services/CatalogService';
import type { EligibilityContext } from '@/core/billing/services/CatalogService';

const buildContext = (): EligibilityContext => ({
  user_id: '00000000-0000-0000-0000-000000000000',
  entity_family: 'company',
  vertical: 'gastronomy',
});

describe('CatalogService - Contract Tests', () => {
  describe('API Contract', () => {
    it('deve aceitar EligibilityContext válido', () => {
      const context = buildContext();

      expect(context).toBeDefined();
      expect(context.entity_family).toBe('company');
      expect(context.vertical).toBe('gastronomy');
    });

    it('deve retornar estrutura de catálogo esperada', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog).toBeDefined();
      expect(catalog).toHaveProperty('version');
      expect(catalog).toHaveProperty('items');
      expect(catalog).toHaveProperty('base_plans');
      expect(catalog).toHaveProperty('vertical_packages');
      expect(catalog).toHaveProperty('addons');
      expect(Array.isArray(catalog.items)).toBe(true);
      expect(catalog.items).toHaveLength(2);
    });
  });

  describe('Filtro por Contexto', () => {
    it('mantém planos base horizontais e restringe itens verticais ao contexto', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog.items.some((item) => item.item_type === 'base_plan')).toBe(true);
      expect(catalog.items.some((item) => item.vertical === 'gastronomy')).toBe(true);
      expect(catalog.items.some((item) => item.vertical === 'retail')).toBe(false);

      catalog.items.forEach((item) => {
        expect(item.entity_family).toBe('company');

        if (item.item_type === 'base_plan') {
          expect(item.vertical).toBeNull();
        } else {
          expect([null, 'gastronomy']).toContain(item.vertical);
        }
      });
    });

    it('deve retornar apenas itens published', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      catalog.items.forEach((item) => {
        expect(item.status).toBe('published');
      });
    });
  });

  describe('Tipos de Item', () => {
    it('deve retornar somente tipos comerciais reconhecidos', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      const validTypes = ['base_plan', 'vertical_package', 'addon'];
      catalog.items.forEach((item) => {
        expect(validTypes).toContain(item.item_type);
      });
    });
  });

  describe('Estrutura de Item', () => {
    it('cada item deve ter campos obrigatórios', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());
      const item = catalog.items[0];

      expect(item).toBeDefined();
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('item_type');
      expect(item).toHaveProperty('entity_family');
      expect(item).toHaveProperty('vertical');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('pricing_model');
      expect(item).toHaveProperty('features');
    });
  });

  describe('Versionamento', () => {
    it('catálogo deve ter versão semântica publicada', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog.version).toBe('1.2.3');
      expect(catalog.version).toMatch(/^v?\d+\.\d+\.\d+$/);
    });
  });
});
