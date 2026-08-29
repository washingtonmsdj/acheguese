/**
 * CatalogService - Contract Tests
 *
 * Valida contratos de API do CatalogService:
 * - planos base horizontais podem ter vertical = null;
 * - pacotes/addons verticais respeitam o contexto solicitado;
 * - somente catálogo published participa do runtime;
 * - versão publicada aceita o formato canônico vN.N.N.
 */

import { describe, it, expect } from 'vitest';
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
    });
  });

  describe('Filtro por Contexto', () => {
    it('mantém planos base horizontais e restringe itens verticais ao contexto', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

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

      if (catalog.items.length > 0) {
        const item = catalog.items[0];

        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('code');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('item_type');
        expect(item).toHaveProperty('entity_family');
        expect(item).toHaveProperty('vertical');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('pricing_model');
        expect(item).toHaveProperty('features');
      }
    });
  });

  describe('Versionamento', () => {
    it('catálogo deve ter versão semântica publicada', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog.version).toBeDefined();
      expect(typeof catalog.version).toBe('string');
      expect(catalog.version).toMatch(/^v?\d+\.\d+\.\d+$/);
    });
  });
});
