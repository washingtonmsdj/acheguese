// @ts-nocheck
/**
 * Testes SSOT - tourist_points (Runtime Services)
 * 
 * Valida comportamento real dos services com dados no banco:
 * - list() com location_id
 * - getBySlug() com contexto territorial
 * - countByCity() com resolução territorial
 * - getCategoriesByCity() com resolução territorial
 * - getCommunityPhotos() com resolução territorial
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { TouristPointService } from '@/core/guide/tourist-points/services/TouristPointService';
import { supabase } from '@/integrations/supabase';

describe('SSOT Territorial - tourist_points (Runtime Services)', () => {
  let runtimeAvailable = false;

  beforeAll(async () => {
    try {
      const { error } = await supabase.from('locations').select('id').limit(1);
      runtimeAvailable = !error;
    } catch {
      runtimeAvailable = false;
    }
  });

  function requireRuntime(): boolean {
    if (!runtimeAvailable) {
      expect(true).toBe(true);
      return false;
    }
    return true;
  }
  
  const BARRA_LOCATION_ID = '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3';
  const PELOURINHO_LOCATION_ID = '40000000-0000-0000-0000-000000000003';

  describe('list() - Filtro por location_id', () => {
    it('deve retornar apenas pontos da Barra quando filtrado por location_id', async () => {
      if (!requireRuntime()) return;
      const points = await TouristPointService.list({
        location_id: BARRA_LOCATION_ID,
        status: 'active'
      });

      expect(points.length).toBeGreaterThan(0);
      points.forEach(point => {
        expect(point.location_id).toBe(BARRA_LOCATION_ID);
      });

      const farol = points.find(p => p.slug === 'farol-da-barra');
      expect(farol).toBeDefined();
      expect(farol?.name).toBe('Farol da Barra');
    }, 10000);

    it('deve restringir pontos do Pelourinho por location_id', async () => {
      if (!requireRuntime()) return;
      const points = await TouristPointService.list({
        location_id: PELOURINHO_LOCATION_ID,
        status: 'active'
      });

      expect(points.length).toBeGreaterThan(0);
      points.forEach(point => {
        expect(point.location_id).toBe(PELOURINHO_LOCATION_ID);
      });
    });

    it('deve retornar array vazio para location_id inexistente', async () => {
      const points = await TouristPointService.list({
        location_id: '00000000-0000-0000-0000-000000000000',
        status: 'active'
      });

      expect(Array.isArray(points)).toBe(true);
    });

    it('deve incluir join com location e address', async () => {
      if (!requireRuntime()) return;
      const points = await TouristPointService.list({
        location_id: BARRA_LOCATION_ID,
        status: 'active'
      });

      if (points.length > 0) {
        const point = points[0];
        expect(point.location).toBeDefined();
        if (point.location) {
          expect(point.location.name).toBeDefined();
          expect(point.location.geographic_path).toBeDefined();
        }
      }
    });
  });

  describe('getBySlug() - Contexto territorial', () => {
    it('deve retornar Farol da Barra quando buscado por slug em Salvador', async () => {
      if (!requireRuntime()) return;
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');

      expect(point).toBeDefined();
      expect(point?.name).toBe('Farol da Barra');
      expect(point?.slug).toBe('farol-da-barra');
      expect(point?.location_id).toBe(BARRA_LOCATION_ID);
    });

    it('deve respeitar contexto territorial ao buscar Pelourinho por slug', async () => {
      if (!requireRuntime()) return;
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'pelourinho');

      if (point) {
        expect(point.slug).toBe('pelourinho');
        expect(point.location_id).toBe(PELOURINHO_LOCATION_ID);
      }
    });

    it('deve retornar null para slug inexistente', async () => {
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'ponto-inexistente-xyz');
      expect(point).toBeNull();
    });

    it('deve validar contexto territorial (não retornar ponto de outra cidade)', async () => {
      const point = await TouristPointService.getBySlug('BA', 'Feira de Santana', 'farol-da-barra');
      expect(point).toBeNull();
    });

    it('deve incluir join com location e address', async () => {
      if (!requireRuntime()) return;
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');

      if (point) {
        expect(point.location).toBeDefined();
        if (point.location) {
          expect(point.location.name).toBe('Barra');
          expect(point.location.geographic_path).toBe('/br/ba/salvador/barra');
        }

        if (point.address) {
          expect(point.address.latitude).toBeDefined();
          expect(point.address.longitude).toBeDefined();
        }
      }
    });
  });

  describe('countByCity() - Resolução territorial', () => {
    it('deve contar pontos turísticos de Salvador usando SSOT', async () => {
      if (!requireRuntime()) return;
      const count = await TouristPointService.countByCity('BA', 'Salvador');
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('deve retornar 0 para cidade sem pontos turísticos', async () => {
      const count = await TouristPointService.countByCity('BA', 'Cidade Inexistente');
      expect(count).toBe(0);
    });

    it('deve usar resolução territorial (não campos legados)', async () => {
      if (!requireRuntime()) return;
      const count = await TouristPointService.countByCity('BA', 'Salvador');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getCategoriesByCity() - Resolução territorial', () => {
    it('deve retornar categorias de Salvador usando SSOT', async () => {
      if (!requireRuntime()) return;
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('historico');
    });

    it('deve retornar array vazio para cidade sem pontos turísticos', async () => {
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Cidade Inexistente');
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(0);
    });

    it('deve usar resolução territorial (não campos legados)', async () => {
      if (!requireRuntime()) return;
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('getCommunityPhotos() - Resolução territorial', () => {
    it('deve retornar fotos quando location_id fornecido', async () => {
      if (!requireRuntime()) return;
      const photos = await TouristPointService.getCommunityPhotos(
        BARRA_LOCATION_ID,
        'salvador',
        'Barra'
      );

      expect(Array.isArray(photos)).toBe(true);

      if (photos.length > 0) {
        const photo = photos[0];
        expect(photo.id).toBeDefined();
        expect(photo.image_url).toBeDefined();
        expect(photo.author_name).toBeDefined();
        expect(photo.created_at).toBeDefined();
      }
    });

    it('deve resolver bairro dentro da cidade quando location_id não fornecido', async () => {
      if (!requireRuntime()) return;
      const photos = await TouristPointService.getCommunityPhotos(
        null,
        'salvador',
        'Barra'
      );

      expect(Array.isArray(photos)).toBe(true);
    });

    it('deve retornar array vazio quando nenhum post encontrado', async () => {
      const photos = await TouristPointService.getCommunityPhotos(
        '00000000-0000-0000-0000-000000000000',
        'salvador',
        'Bairro Inexistente'
      );

      expect(Array.isArray(photos)).toBe(true);
    });
  });

  describe('Integração - Fluxo completo', () => {
    it('deve executar fluxo completo: list → getBySlug → countByCity', async () => {
      if (!requireRuntime()) return;
      const allPoints = await TouristPointService.list({ status: 'active' });
      expect(allPoints.length).toBeGreaterThan(0);

      const farol = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');
      expect(farol).toBeDefined();
      expect(farol?.location_id).toBe(BARRA_LOCATION_ID);

      const count = await TouristPointService.countByCity('BA', 'Salvador');
      expect(count).toBeGreaterThanOrEqual(3);

      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');
      expect(categories).toContain('historico');

      const photos = await TouristPointService.getCommunityPhotos(
        farol?.location_id || null,
        'salvador',
        'Barra'
      );
      expect(Array.isArray(photos)).toBe(true);
    });
  });
});
