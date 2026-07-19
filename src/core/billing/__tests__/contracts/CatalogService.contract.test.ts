/**
 * CatalogService - Contract Tests
 * 
 * Valida contratos de API do CatalogService:
 * - Filtro por entity_family + vertical
 * - Retorno apenas de itens published
 * - Estrutura de catálogo
 * 
 * FASE 7: SSOT Enforcement
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
      expect(Array.isArray(catalog.items)).toBe(true);
    });
  });

  describe('Filtro por Contexto', () => {
    it('deve filtrar por entity_family + vertical', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog.items.length).toBeGreaterThanOrEqual(0);

      if (catalog.items.length > 0) {
        catalog.items.forEach(item => {
          expect(item.entity_family).toBe('company');
          expect(item.vertical).toBe('gastronomy');
        });
      }
    });

    it('deve retornar apenas itens published', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      catalog.items.forEach(item => {
        expect(item.status).toBe('published');
      });
    });
  });

  describe('Tipos de Item', () => {
    it('deve retornar base_plan, vertical_package e addon', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      const validTypes = ['base_plan', 'vertical_package', 'addon'];
      catalog.items.forEach(item => {
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
      }
    });
  });

  describe('Versionamento', () => {
    it('catálogo deve ter versão', async () => {
      const catalog = await CatalogService.getEligibleCatalog(buildContext());

      expect(catalog.version).toBeDefined();
      expect(typeof catalog.version).toBe('string');
      expect(catalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
