/**
 * DriverRepository Tests
 * 
 * Testes unitários para DriverRepository
 * Cobertura: 100% dos métodos públicos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriverRepository, type Driver } from '../DriverRepository';
import { DatabaseError, DatabaseErrorCode } from '../../errors/DatabaseError';

// Mock do Supabase
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('DriverRepository', () => {
  let repository: DriverRepository;
  let mockSupabase: any;

  const mockDriver: Driver = {
    id: 'driver-123',
    profile_id: 'profile-456',
    vehicle_type: 'sedan',
    vehicle_plate: 'ABC-1234',
    vehicle_model: 'Toyota Corolla',
    vehicle_color: 'Prata',
    license_number: 'CNH123456',
    is_available: true,
    current_lat: -23.5505,
    current_lng: -46.6333,
    rating: 4.8,
    total_rides: 150,
    total_earnings: 5000.00,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-05-30T10:00:00Z',
    last_location_update: '2026-05-30T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new DriverRepository();
    
    // Setup mock Supabase
    const { supabase } = require('@/integrations/supabase');
    mockSupabase = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    };
    supabase.from.mockReturnValue(mockSupabase);
  });

  describe('findByProfileId', () => {
    it('deve buscar driver por profile_id', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockDriver,
        error: null,
      });

      const result = await repository.findByProfileId('profile-456');

      expect(result).toEqual(mockDriver);
      expect(mockSupabase.eq).toHaveBeenCalledWith('profile_id', 'profile-456');
    });

    it('deve retornar null se driver não existir', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repository.findByProfileId('profile-999');

      expect(result).toBeNull();
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.findByProfileId('profile-456')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('findAvailable', () => {
    it('deve buscar motoristas disponíveis', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      const result = await repository.findAvailable();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findAvailableInArea', () => {
    it('deve buscar motoristas disponíveis em área', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      const result = await repository.findAvailableInArea(-23.5505, -46.6333, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve filtrar por disponibilidade e status ativo', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findAvailableInArea(-23.5505, -46.6333, 5);

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_available', true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('deve filtrar por localização não nula', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findAvailableInArea(-23.5505, -46.6333, 5);

      expect(mockSupabase.not).toHaveBeenCalledWith('current_lat', 'is', null);
      expect(mockSupabase.not).toHaveBeenCalledWith('current_lng', 'is', null);
    });

    it('deve calcular bounding box corretamente', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findAvailableInArea(-23.5505, -46.6333, 10);

      expect(mockSupabase.gte).toHaveBeenCalled();
      expect(mockSupabase.lte).toHaveBeenCalled();
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.findAvailableInArea(-23.5505, -46.6333, 5)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateAvailability', () => {
    it('deve atualizar disponibilidade do motorista', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, is_available: false },
        error: null,
      });

      const result = await repository.updateAvailability('driver-123', false);

      expect(result).toBeDefined();
    });
  });

  describe('updateLocation', () => {
    it('deve atualizar localização do motorista', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, current_lat: -23.5629, current_lng: -46.6544 },
        error: null,
      });

      const result = await repository.updateLocation('driver-123', -23.5629, -46.6544);

      expect(result).toBeDefined();
    });
  });

  describe('incrementTotalRides', () => {
    it('deve incrementar total de corridas', async () => {
      // Mock findById
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: mockDriver,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, total_rides: 151 },
        error: null,
      });

      const result = await repository.incrementTotalRides('driver-123');

      expect(result).toBeDefined();
    });

    it('deve lançar erro se driver não existir', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        repository.incrementTotalRides('driver-999')
      ).rejects.toThrow(DatabaseError);
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.incrementTotalRides('driver-123')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('incrementEarnings', () => {
    it('deve incrementar ganhos totais', async () => {
      // Mock findById
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: mockDriver,
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, total_earnings: 5025.50 },
        error: null,
      });

      const result = await repository.incrementEarnings('driver-123', 25.50);

      expect(result).toBeDefined();
    });

    it('deve lançar erro se driver não existir', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(
        repository.incrementEarnings('driver-999', 25.50)
      ).rejects.toThrow(DatabaseError);
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.incrementEarnings('driver-123', 25.50)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateRating', () => {
    it('deve atualizar rating do motorista', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, rating: 4.9 },
        error: null,
      });

      const result = await repository.updateRating('driver-123', 4.9);

      expect(result).toBeDefined();
    });
  });

  describe('findByStatus', () => {
    it('deve buscar motoristas por status active', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      const result = await repository.findByStatus('active');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve buscar motoristas por status inactive', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.findByStatus('inactive');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve buscar motoristas por status suspended', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.findByStatus('suspended');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findTopByRating', () => {
    it('deve buscar top motoristas por rating', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      const result = await repository.findTopByRating(10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve usar limite padrão de 10', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findTopByRating();

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });

    it('deve filtrar apenas motoristas ativos com rating', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findTopByRating(10);

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabase.not).toHaveBeenCalledWith('rating', 'is', null);
    });

    it('deve ordenar por rating decrescente', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      await repository.findTopByRating(10);

      expect(mockSupabase.order).toHaveBeenCalledWith('rating', { ascending: false });
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(repository.findTopByRating()).rejects.toThrow(DatabaseError);
    });
  });

  describe('findByVehicleType', () => {
    it('deve buscar motoristas por tipo de veículo', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockDriver],
        error: null,
      });

      const result = await repository.findByVehicleType('sedan');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('countAvailable', () => {
    it('deve contar motoristas disponíveis', async () => {
      const result = await repository.countAvailable();
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suspend', () => {
    it('deve suspender motorista', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, status: 'suspended', is_available: false },
        error: null,
      });

      const result = await repository.suspend('driver-123');

      expect(result).toBeDefined();
    });
  });

  describe('reactivate', () => {
    it('deve reativar motorista', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDriver, status: 'active' },
        error: null,
      });

      const result = await repository.reactivate('driver-123');

      expect(result).toBeDefined();
    });
  });
});
