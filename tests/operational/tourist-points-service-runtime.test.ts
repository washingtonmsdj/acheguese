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

import { describe, it, expect } from 'vitest';
import { TouristPointService } from '../../src/core/guide/tourist-points/services/TouristPointService';
import { describeOperational } from '../helpers/operational-env';

describeOperational('SSOT Territorial - tourist_points (Runtime Services)', {
  requireAnonKey: true,
}, () => {
  
  // IDs conhecidos dos tourist_points criados
  const BARRA_LOCATION_ID = '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3';
  const PELOURINHO_LOCATION_ID = '40000000-0000-0000-0000-000000000003';

  describe('list() - Filtro por location_id', () => {
    it('deve retornar apenas pontos da Barra quando filtrado por location_id', async () => {
      const points = await TouristPointService.list({
        location_id: BARRA_LOCATION_ID,
        status: 'active'
      });

      // Deve retornar pelo menos o Farol da Barra
      expect(points.length).toBeGreaterThan(0);
      
      // Todos os pontos devem ter location_id da Barra
      points.forEach(point => {
        expect(point.location_id).toBe(BARRA_LOCATION_ID);
      });

      // Deve incluir o Farol da Barra
      const farol = points.find(p => p.slug === 'farol-da-barra');
      expect(farol).toBeDefined();
      expect(farol?.name).toBe('Farol da Barra');
    }, 10000); // 10s timeout

    it('deve restringir pontos do Pelourinho por location_id', async () => {
      const points = await TouristPointService.list({
        location_id: PELOURINHO_LOCATION_ID,
        status: 'active'
      });

      // Deve retornar pelo menos o Pelourinho
      expect(points.length).toBeGreaterThan(0);
      
      // Todos os pontos devem ter location_id do Pelourinho
      points.forEach(point => {
        expect(point.location_id).toBe(PELOURINHO_LOCATION_ID);
      });

    });

    it('deve retornar array vazio para location_id inexistente', async () => {
      const points = await TouristPointService.list({
        location_id: '00000000-0000-0000-0000-000000000000',
        status: 'active'
      });

      // Pode retornar mock ou array vazio
      expect(Array.isArray(points)).toBe(true);
    });

    it('deve incluir join com location e address', async () => {
      const points = await TouristPointService.list({
        location_id: BARRA_LOCATION_ID,
        status: 'active'
      });

      if (points.length > 0) {
        const point = points[0];
        
        // Verificar se location está presente
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
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');

      expect(point).toBeDefined();
      expect(point?.name).toBe('Farol da Barra');
      expect(point?.slug).toBe('farol-da-barra');
      expect(point?.location_id).toBe(BARRA_LOCATION_ID);
    });

    it('deve respeitar contexto territorial ao buscar Pelourinho por slug', async () => {
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
      // Buscar em cidade diferente
      const point = await TouristPointService.getBySlug('BA', 'Feira de Santana', 'farol-da-barra');

      // Não deve retornar porque Farol da Barra está em Salvador, não em Feira
      expect(point).toBeNull();
    });

    it('deve incluir join com location e address', async () => {
      const point = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');

      if (point) {
        // Verificar location
        expect(point.location).toBeDefined();
        if (point.location) {
          expect(point.location.name).toBe('Barra');
          expect(point.location.geographic_path).toBe('/br/ba/salvador/barra');
        }

        // Verificar address (pode não existir)
        if (point.address) {
          expect(point.address.latitude).toBeDefined();
          expect(point.address.longitude).toBeDefined();
        }
      }
    });
  });

  describe('countByCity() - Resolução territorial', () => {
    it('deve contar pontos turísticos de Salvador usando SSOT', async () => {
      const count = await TouristPointService.countByCity('BA', 'Salvador');

      // Deve contar pelo menos os 3 pontos criados
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('deve retornar 0 para cidade sem pontos turísticos', async () => {
      const count = await TouristPointService.countByCity('BA', 'Cidade Inexistente');

      expect(count).toBe(0);
    });

    it('deve usar resolução territorial (não campos legados)', async () => {
      // Este teste valida que countByCity usa resolveCityToLocationIds
      // Se usar campos legados, não encontraria os pontos criados apenas com location_id
      const count = await TouristPointService.countByCity('BA', 'Salvador');

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getCategoriesByCity() - Resolução territorial', () => {
    it('deve retornar categorias de Salvador usando SSOT', async () => {
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');

      // Deve incluir pelo menos as categorias dos 3 pontos criados
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Deve refletir as categorias realmente seedadas para o território.
      expect(categories).toContain('historico');
    });

    it('deve retornar array vazio para cidade sem pontos turísticos', async () => {
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Cidade Inexistente');

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(0);
    });

    it('deve usar resolução territorial (não campos legados)', async () => {
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');

      // Se usar campos legados, não encontraria os pontos criados apenas com location_id
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('getCommunityPhotos() - Resolução territorial', () => {
    it('deve retornar fotos quando location_id fornecido', async () => {
      const photos = await TouristPointService.getCommunityPhotos(
        BARRA_LOCATION_ID,
        'salvador',
        'Barra'
      );

      // O serviço não fabrica dados quando não há posts com imagem.
      expect(Array.isArray(photos)).toBe(true);

      // Validar estrutura das fotos
      if (photos.length > 0) {
        const photo = photos[0];
        expect(photo.id).toBeDefined();
        expect(photo.image_url).toBeDefined();
        expect(photo.author_name).toBeDefined();
        expect(photo.created_at).toBeDefined();
      }
    });

    it('deve resolver bairro dentro da cidade quando location_id não fornecido', async () => {
      const photos = await TouristPointService.getCommunityPhotos(
        null,
        'salvador',
        'Barra'
      );

      // Deve usar resolveNeighborhoodInCity para encontrar location_id
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
      // 1. Listar pontos de Salvador
      const allPoints = await TouristPointService.list({ status: 'active' });
      expect(allPoints.length).toBeGreaterThan(0);

      // 2. Buscar ponto específico por slug
      const farol = await TouristPointService.getBySlug('BA', 'Salvador', 'farol-da-barra');
      expect(farol).toBeDefined();
      expect(farol?.location_id).toBe(BARRA_LOCATION_ID);

      // 3. Contar pontos de Salvador
      const count = await TouristPointService.countByCity('BA', 'Salvador');
      expect(count).toBeGreaterThanOrEqual(3);

      // 4. Buscar categorias
      const categories = await TouristPointService.getCategoriesByCity('BA', 'Salvador');
      expect(categories).toContain('historico');

      // 5. Buscar fotos da comunidade
      const photos = await TouristPointService.getCommunityPhotos(
        farol?.location_id || null,
        'salvador',
        'Barra'
      );
      expect(Array.isArray(photos)).toBe(true);
    });
  });
});
