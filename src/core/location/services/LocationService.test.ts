// @ts-nocheck
/**
 * @fileoverview Testes unitários para LocationService
 * @module core/location/services/LocationService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationService } from './LocationService';
import { LocationError, LocationErrorCode } from '../errors/LocationError';
import type { ILocationRepository } from '../repositories/ILocationRepository';
import type { Location, LocationType, LocationStatus } from '../types';

// Mock data
const mockLocation: Location = {
  id: 'loc-123',
  parent_id: null,
  type: 'state' as LocationType,
  slug: 'bahia',
  name: 'Bahia',
  full_name: 'Bahia',
  geographic_path: '/br/bahia',
  status: 'active' as LocationStatus,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockCity: Location = {
  id: 'loc-456',
  parent_id: 'loc-123',
  type: 'city' as LocationType,
  slug: 'salvador',
  name: 'Salvador',
  full_name: 'Salvador, Bahia',
  geographic_path: '/br/bahia/salvador',
  status: 'active' as LocationStatus,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// Mock Repository
const createMockRepository = (): ILocationRepository => ({
  findById: vi.fn(),
  findByPath: vi.fn(),
  findBySlugWithinParent: vi.fn(),
  findAncestors: vi.fn(),
  findDescendants: vi.fn(),
  findChildren: vi.fn(),
  findAll: vi.fn(),
});

describe('LocationService', () => {
  let service: LocationService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new LocationService(mockRepo);
  });

  describe('getLocationById', () => {
    it('deve retornar location quando ID é válido', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);

      const result = await service.getLocationById({ id: 'loc-123' });

      expect(result.location).toEqual(mockLocation);
      expect(mockRepo.findById).toHaveBeenCalledWith('loc-123');
    });

    it('deve lançar erro quando ID é inválido', async () => {
      await expect(service.getLocationById({ id: '' })).rejects.toThrow(LocationError);
      await expect(service.getLocationById({ id: null as unknown as string })).rejects.toThrow(LocationError);
      await expect(service.getLocationById({ id: 123 as unknown as string })).rejects.toThrow(LocationError);
    });

    it('deve lançar erro quando location não é encontrada', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getLocationById({ id: 'not-found' })).rejects.toThrow(
        LocationError
      );
    });
  });

  describe('getLocationByPath', () => {
    it('deve retornar location quando path é válido', async () => {
      mockRepo.findByPath.mockResolvedValue(mockLocation);

      const result = await service.getLocationByPath({ path: '/br/bahia' });

      expect(result.location).toEqual(mockLocation);
      expect(mockRepo.findByPath).toHaveBeenCalledWith('/br/bahia');
    });

    it('deve lançar erro quando path não começa com /', async () => {
      await expect(service.getLocationByPath({ path: 'invalid' })).rejects.toThrow(
        LocationError
      );
    });

    it('deve lançar erro quando location não é encontrada por path', async () => {
      mockRepo.findByPath.mockResolvedValue(null);

      await expect(service.getLocationByPath({ path: '/not/found' })).rejects.toThrow(
        LocationError
      );
    });
  });

  describe('getLocationBySlugWithinParent', () => {
    it('deve retornar location quando slug e parent são válidos', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);
      mockRepo.findBySlugWithinParent.mockResolvedValue(mockCity);

      const result = await service.getLocationBySlugWithinParent({
        slug: 'salvador',
        parent_id: 'loc-123',
      });

      expect(result.location).toEqual(mockCity);
    });

    it('deve lançar erro quando slug é vazio', async () => {
      await expect(
        service.getLocationBySlugWithinParent({ slug: '', parent_id: 'loc-123' })
      ).rejects.toThrow(LocationError);
    });

    it('deve lançar erro quando parent_id é vazio', async () => {
      await expect(
        service.getLocationBySlugWithinParent({ slug: 'salvador', parent_id: '' })
      ).rejects.toThrow(LocationError);
    });

    it('deve lançar erro quando parent não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.getLocationBySlugWithinParent({ slug: 'salvador', parent_id: 'not-found' })
      ).rejects.toThrow(LocationError);
    });
  });

  describe('getAncestors', () => {
    it('deve retornar ancestrais da location', async () => {
      const ancestors = [mockLocation];
      mockRepo.findById.mockResolvedValue(mockCity);
      mockRepo.findAncestors.mockResolvedValue(ancestors);

      const result = await service.getAncestors({ location_id: 'loc-456' });

      expect(result.ancestors).toEqual(ancestors);
      expect(result.count).toBe(1);
    });

    it('deve incluir self quando solicitado', async () => {
      const ancestors = [mockLocation, mockCity];
      mockRepo.findById.mockResolvedValue(mockCity);
      mockRepo.findAncestors.mockResolvedValue(ancestors);

      const result = await service.getAncestors({ location_id: 'loc-456', include_self: true });

      expect(result.ancestors).toEqual(ancestors);
      expect(mockRepo.findAncestors).toHaveBeenCalledWith('loc-456', true);
    });

    it('deve lançar erro quando location não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getAncestors({ location_id: 'not-found' })).rejects.toThrow(
        LocationError
      );
    });
  });

  describe('getDescendants', () => {
    it('deve retornar descendentes paginados', async () => {
      const descendants = [mockCity];
      mockRepo.findById.mockResolvedValue(mockLocation);
      mockRepo.findDescendants.mockResolvedValue({
        locations: descendants,
        total_count: 1,
      });

      const result = await service.getDescendants({ location_id: 'loc-123' });

      expect(result.descendants).toEqual(descendants);
      expect(result.total_count).toBe(1);
      expect(result.has_more).toBe(false);
    });

    it('deve respeitar paginação customizada', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);
      mockRepo.findDescendants.mockResolvedValue({
        locations: [],
        total_count: 100,
      });

      const result = await service.getDescendants({
        location_id: 'loc-123',
        page: 2,
        page_size: 10,
      });

      expect(result.page).toBe(2);
      expect(result.page_size).toBe(10);
      expect(result.has_more).toBe(true);
    });

    it('deve lançar erro quando max_depth excede limite', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);

      await expect(
        service.getDescendants({ location_id: 'loc-123', max_depth: 20 })
      ).rejects.toThrow(LocationError);
    });
  });

  describe('getChildren', () => {
    it('deve retornar filhos diretos', async () => {
      const children = [mockCity];
      mockRepo.findById.mockResolvedValue(mockLocation);
      mockRepo.findChildren.mockResolvedValue({
        locations: children,
        total_count: 1,
      });

      const result = await service.getChildren({ location_id: 'loc-123' });

      expect(result.children).toEqual(children);
      expect(result.total_count).toBe(1);
    });

    it('deve filtrar por tipo quando especificado', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);
      mockRepo.findChildren.mockResolvedValue({
        locations: [],
        total_count: 0,
      });

      await service.getChildren({ location_id: 'loc-123', type: 'city' as LocationType });

      expect(mockRepo.findChildren).toHaveBeenCalledWith(
        'loc-123',
        expect.objectContaining({ type: 'city' })
      );
    });

    it('deve lançar erro quando location não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getChildren({ location_id: 'not-found' })).rejects.toThrow(
        LocationError
      );
    });
  });

  describe('validateLocation', () => {
    it('deve validar location com sucesso', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);

      const result = await service.validateLocation({
        location_id: 'loc-123',
        required_status: 'active',
        required_type: 'state',
      });

      expect(result.is_valid).toBe(true);
      expect(result.location).toEqual(mockLocation);
      expect(result.validation_errors).toHaveLength(0);
    });

    it('deve retornar erros quando status não corresponde', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);

      const result = await service.validateLocation({
        location_id: 'loc-123',
        required_status: 'inactive',
      });

      expect(result.is_valid).toBe(false);
      // A mensagem contém o status atual e o esperado
      expect(result.validation_errors[0]).toContain('active');
      expect(result.validation_errors[0]).toContain('inactive');
    });

    it('deve retornar erros quando tipo não corresponde', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);

      const result = await service.validateLocation({
        location_id: 'loc-123',
        required_type: 'city',
      });

      expect(result.is_valid).toBe(false);
      // A mensagem contém o tipo atual (state) e o esperado (city)
      expect(result.validation_errors[0]).toContain('state');
      expect(result.validation_errors[0]).toContain('city');
    });

    it('deve retornar inválido quando location não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.validateLocation({ location_id: 'not-found' });

      expect(result.is_valid).toBe(false);
      expect(result.location).toBeNull();
    });
  });

  describe('getLocationTree', () => {
    it('deve construir árvore de localizações', async () => {
      mockRepo.findById.mockResolvedValue(mockLocation);
      // Primeira chamada retorna cidade, segunda (para a cidade) retorna vazio
      mockRepo.findChildren
        .mockResolvedValueOnce({
          locations: [mockCity],
          total_count: 1,
        })
        .mockResolvedValue({
          locations: [],
          total_count: 0,
        });

      const result = await service.getLocationTree({ id: 'loc-123' });

      expect(result.tree.location).toEqual(mockLocation);
      expect(result.tree.children).toHaveLength(1);
      expect(result.total_nodes).toBe(2); // parent + 1 child
    });

    it('deve lançar erro quando location não existe', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getLocationTree({ id: 'not-found' })).rejects.toThrow(
        LocationError
      );
    });
  });

  describe('Error handling', () => {
    it('deve criar LocationError com código correto', async () => {
      mockRepo.findById.mockResolvedValue(null);

      try {
        await service.getLocationById({ id: 'not-found' });
      } catch (error) {
        expect(error).toBeInstanceOf(LocationError);
        expect((error as LocationError).code).toBe('LOCATION_NOT_FOUND');
      }
    });
  });
});