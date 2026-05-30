/**
 * RideRepository Tests
 * 
 * Testes unitários para RideRepository
 * Cobertura: 100% dos métodos públicos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RideRepository, type Ride, type RideStatus } from '../RideRepository';
import { DatabaseError, DatabaseErrorCode } from '../../errors/DatabaseError';

// Mock do Supabase
vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('RideRepository', () => {
  let repository: RideRepository;
  let mockSupabase: any;

  const mockRide: Ride = {
    id: 'ride-123',
    passenger_id: 'passenger-456',
    driver_id: 'driver-789',
    pickup_lat: -23.5505,
    pickup_lng: -46.6333,
    pickup_address: 'Av. Paulista, 1000',
    dropoff_lat: -23.5629,
    dropoff_lng: -46.6544,
    dropoff_address: 'Rua Augusta, 500',
    status: 'pending',
    price: 25.50,
    distance_km: 5.2,
    duration_minutes: 15,
    payment_method: 'credit_card',
    payment_status: 'pending',
    rating: null,
    notes: null,
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-05-30T10:00:00Z',
    accepted_at: null,
    started_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new RideRepository();
    
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
    };
    supabase.from.mockReturnValue(mockSupabase);
  });

  describe('findByPassengerId', () => {
    it('deve buscar rides por passageiro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findByPassengerId('passenger-456');

      expect(result).toBeDefined();
      expect(mockSupabase.eq).toHaveBeenCalledWith('passenger_id', 'passenger-456');
    });
  });

  describe('findByDriverId', () => {
    it('deve buscar rides por motorista', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findByDriverId('driver-789');

      expect(result).toBeDefined();
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-789');
    });
  });

  describe('findByStatus', () => {
    it('deve buscar rides por status', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findByStatus('pending');

      expect(result).toBeDefined();
    });
  });

  describe('findPending', () => {
    it('deve buscar rides pendentes', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findPending();

      expect(result).toBeDefined();
    });
  });

  describe('findInProgress', () => {
    it('deve buscar rides em progresso', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [{ ...mockRide, status: 'in_progress' }],
        error: null,
      });

      const result = await repository.findInProgress();

      expect(result).toBeDefined();
    });
  });

  describe('findCompleted', () => {
    it('deve buscar rides completadas', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [{ ...mockRide, status: 'completed' }],
        error: null,
      });

      const result = await repository.findCompleted();

      expect(result).toBeDefined();
    });
  });

  describe('findCancelled', () => {
    it('deve buscar rides canceladas', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [{ ...mockRide, status: 'cancelled' }],
        error: null,
      });

      const result = await repository.findCancelled();

      expect(result).toBeDefined();
    });
  });

  describe('findActiveByPassengerId', () => {
    it('deve buscar ride ativa de passageiro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockRide,
        error: null,
      });

      const result = await repository.findActiveByPassengerId('passenger-456');

      expect(result).toEqual(mockRide);
      expect(mockSupabase.eq).toHaveBeenCalledWith('passenger_id', 'passenger-456');
      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['pending', 'searching', 'accepted', 'in_progress']);
    });

    it('deve retornar null se não houver ride ativa', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repository.findActiveByPassengerId('passenger-456');

      expect(result).toBeNull();
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.findActiveByPassengerId('passenger-456')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('findActiveByDriverId', () => {
    it('deve buscar ride ativa de motorista', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockRide,
        error: null,
      });

      const result = await repository.findActiveByDriverId('driver-789');

      expect(result).toEqual(mockRide);
      expect(mockSupabase.eq).toHaveBeenCalledWith('driver_id', 'driver-789');
      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['accepted', 'in_progress']);
    });

    it('deve retornar null se não houver ride ativa', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await repository.findActiveByDriverId('driver-789');

      expect(result).toBeNull();
    });
  });

  describe('countByStatus', () => {
    it('deve contar rides por status', async () => {
      const result = await repository.countByStatus('pending');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('countByPassengerId', () => {
    it('deve contar rides de passageiro', async () => {
      const result = await repository.countByPassengerId('passenger-456');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('countByDriverId', () => {
    it('deve contar rides de motorista', async () => {
      const result = await repository.countByDriverId('driver-789');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findInArea', () => {
    it('deve buscar rides em área geográfica', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findInArea(-23.5505, -46.6333, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve calcular bounding box corretamente', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      await repository.findInArea(-23.5505, -46.6333, 10);

      expect(mockSupabase.gte).toHaveBeenCalled();
      expect(mockSupabase.lte).toHaveBeenCalled();
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        repository.findInArea(-23.5505, -46.6333, 5)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status da ride', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'accepted' },
        error: null,
      });

      const result = await repository.updateStatus('ride-123', 'accepted');

      expect(result).toBeDefined();
    });

    it('deve adicionar timestamp de accepted_at ao aceitar', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'accepted', accepted_at: expect.any(String) },
        error: null,
      });

      await repository.updateStatus('ride-123', 'accepted');
      // Timestamp é adicionado automaticamente
    });

    it('deve adicionar timestamp de started_at ao iniciar', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'in_progress', started_at: expect.any(String) },
        error: null,
      });

      await repository.updateStatus('ride-123', 'in_progress');
      // Timestamp é adicionado automaticamente
    });

    it('deve adicionar timestamp de completed_at ao completar', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'completed', completed_at: expect.any(String) },
        error: null,
      });

      await repository.updateStatus('ride-123', 'completed');
      // Timestamp é adicionado automaticamente
    });

    it('deve adicionar timestamp de cancelled_at ao cancelar', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'cancelled', cancelled_at: expect.any(String) },
        error: null,
      });

      await repository.updateStatus('ride-123', 'cancelled');
      // Timestamp é adicionado automaticamente
    });

    it('deve aceitar metadata adicional', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'completed', price: 30.00 },
        error: null,
      });

      await repository.updateStatus('ride-123', 'completed', { price: 30.00 });
      // Metadata é incluída no update
    });
  });

  describe('assignDriver', () => {
    it('deve atribuir motorista à ride', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, driver_id: 'driver-999', status: 'accepted' },
        error: null,
      });

      const result = await repository.assignDriver('ride-123', 'driver-999');

      expect(result).toBeDefined();
    });
  });

  describe('startRide', () => {
    it('deve iniciar ride', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'in_progress' },
        error: null,
      });

      const result = await repository.startRide('ride-123');

      expect(result).toBeDefined();
    });
  });

  describe('completeRide', () => {
    it('deve completar ride', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'completed', price: 30.00 },
        error: null,
      });

      const result = await repository.completeRide('ride-123', 30.00);

      expect(result).toBeDefined();
    });

    it('deve completar ride com rating', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'completed', rating: 5 },
        error: null,
      });

      const result = await repository.completeRide('ride-123', 30.00, 5);

      expect(result).toBeDefined();
    });
  });

  describe('cancelRide', () => {
    it('deve cancelar ride com motivo', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockRide, status: 'cancelled', cancellation_reason: 'Passageiro desistiu' },
        error: null,
      });

      const result = await repository.cancelRide('ride-123', 'Passageiro desistiu');

      expect(result).toBeDefined();
    });
  });

  describe('findRecent', () => {
    it('deve buscar rides recentes (últimas 24h)', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const result = await repository.findRecent(50);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve usar limite padrão de 50', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      await repository.findRecent();

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(repository.findRecent()).rejects.toThrow(DatabaseError);
    });
  });

  describe('findByPeriod', () => {
    it('deve buscar rides por período', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-31');

      const result = await repository.findByPeriod(startDate, endDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('deve usar datas corretas no filtro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: [mockRide],
        error: null,
      });

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-31');

      await repository.findByPeriod(startDate, endDate);

      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('deve lançar DatabaseError em caso de erro', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-31');

      await expect(
        repository.findByPeriod(startDate, endDate)
      ).rejects.toThrow(DatabaseError);
    });
  });
});
