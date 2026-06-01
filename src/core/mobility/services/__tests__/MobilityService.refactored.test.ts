/**
 * MobilityService.refactored Tests
 * 
 * Testes unitários para MobilityServiceRefactored
 * Cobertura: Principais métodos públicos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MobilityServiceRefactored } from '../MobilityService.refactored';
import type { Ride, Driver, RideStatus } from '@/core/infrastructure/database';

// Mock dos repositories
vi.mock('@/core/infrastructure/database', () => ({
  RideRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findAll: vi.fn(),
    findByPassengerId: vi.fn(),
    findByDriverId: vi.fn(),
    findActiveByPassengerId: vi.fn(),
    findActiveByDriverId: vi.fn(),
    findInProgress: vi.fn(),
    findRecent: vi.fn(),
    findByPeriod: vi.fn(),
    findInArea: vi.fn(),
    assignDriver: vi.fn(),
    startRide: vi.fn(),
    completeRide: vi.fn(),
    cancelRide: vi.fn(),
    updateStatus: vi.fn(),
    countByStatus: vi.fn(),
    countByPassengerId: vi.fn(),
    countByDriverId: vi.fn(),
    count: vi.fn(),
    createOrderBy: vi.fn((field, direction) => ({ field, direction })),
  })),
  DriverRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
    findByProfileId: vi.fn(),
    findAvailable: vi.fn(),
    findAvailableInArea: vi.fn(),
    updateAvailability: vi.fn(),
    updateLocation: vi.fn(),
    incrementTotalRides: vi.fn(),
    incrementEarnings: vi.fn(),
    updateRating: vi.fn(),
    findTopByRating: vi.fn(),
    findByVehicleType: vi.fn(),
    countAvailable: vi.fn(),
    suspend: vi.fn(),
    reactivate: vi.fn(),
    count: vi.fn(),
  })),
}));

describe('MobilityServiceRefactored', () => {
  let service: MobilityServiceRefactored;
  let mockRideRepository: any;
  let mockDriverRepository: any;

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
    service = new MobilityServiceRefactored();
    
    // Acessar os mocks dos repositories
    mockRideRepository = (service as any).rideRepository;
    mockDriverRepository = (service as any).driverRepository;
  });

  // ============================================================================
  // RIDE OPERATIONS TESTS
  // ============================================================================

  describe('Ride Operations', () => {
    it('getRideById deve buscar ride por ID', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      const result = await service.getRideById('ride-123');

      expect(result).toEqual(mockRide);
      expect(mockRideRepository.findById).toHaveBeenCalledWith('ride-123');
    });

    it('getRideById deve retornar null em caso de erro', async () => {
      mockRideRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.getRideById('ride-123');

      expect(result).toBeNull();
    });

    it('createRide deve criar nova ride', async () => {
      const newRide = { ...mockRide, id: 'ride-new' };
      mockRideRepository.create.mockResolvedValue(newRide);

      const result = await service.createRide({ passenger_id: 'passenger-456' });

      expect(result).toEqual(newRide);
      expect(mockRideRepository.create).toHaveBeenCalled();
    });

    it('updateRide deve atualizar ride', async () => {
      const updated = { ...mockRide, status: 'accepted' as RideStatus };
      mockRideRepository.update.mockResolvedValue(updated);

      const result = await service.updateRide('ride-123', { status: 'accepted' });

      expect(result).toEqual(updated);
      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-123', { status: 'accepted' });
    });

    it('getRidesByPassenger deve buscar rides por passageiro', async () => {
      mockRideRepository.findByPassengerId.mockResolvedValue([mockRide]);

      const result = await service.getRidesByPassenger('passenger-456');

      expect(result).toEqual([mockRide]);
      expect(mockRideRepository.findByPassengerId).toHaveBeenCalledWith('passenger-456');
    });

    it('getRidesByDriverProfile deve buscar rides por motorista', async () => {
      mockRideRepository.findByDriverId.mockResolvedValue([mockRide]);

      const result = await service.getRidesByDriverProfile('driver-789');

      expect(result).toEqual([mockRide]);
      expect(mockRideRepository.findByDriverId).toHaveBeenCalledWith('driver-789');
    });

    it('getActiveRide deve buscar ride ativa como passageiro', async () => {
      mockRideRepository.findActiveByPassengerId.mockResolvedValue(mockRide);

      const result = await service.getActiveRide('passenger-456');

      expect(result).toEqual(mockRide);
    });

    it('getActiveRide deve buscar ride ativa como motorista se não for passageiro', async () => {
      mockRideRepository.findActiveByPassengerId.mockResolvedValue(null);
      mockRideRepository.findActiveByDriverId.mockResolvedValue(mockRide);

      const result = await service.getActiveRide('driver-789');

      expect(result).toEqual(mockRide);
    });

    it('assignDriver deve atribuir motorista à ride', async () => {
      const updated = { ...mockRide, driver_id: 'driver-999', status: 'accepted' as RideStatus };
      mockRideRepository.assignDriver.mockResolvedValue(updated);

      const result = await service.assignDriver('ride-123', 'driver-999');

      expect(result).toEqual(updated);
      expect(mockRideRepository.assignDriver).toHaveBeenCalledWith('ride-123', 'driver-999');
    });

    it('startRide deve iniciar ride', async () => {
      const updated = { ...mockRide, status: 'in_progress' as RideStatus };
      mockRideRepository.startRide.mockResolvedValue(updated);

      const result = await service.startRide('ride-123');

      expect(result).toEqual(updated);
      expect(mockRideRepository.startRide).toHaveBeenCalledWith('ride-123');
    });

    it('completeRide deve completar ride', async () => {
      const updated = { ...mockRide, status: 'completed' as RideStatus, price: 30.00 };
      mockRideRepository.completeRide.mockResolvedValue(updated);

      const result = await service.completeRide('ride-123', 30.00, 5);

      expect(result).toEqual(updated);
      expect(mockRideRepository.completeRide).toHaveBeenCalledWith('ride-123', 30.00, 5);
    });

    it('cancelRide deve cancelar ride', async () => {
      const updated = { ...mockRide, status: 'cancelled' as RideStatus };
      mockRideRepository.cancelRide.mockResolvedValue(updated);

      const result = await service.cancelRide('ride-123', 'Passageiro desistiu');

      expect(result).toEqual(updated);
      expect(mockRideRepository.cancelRide).toHaveBeenCalledWith('ride-123', 'Passageiro desistiu');
    });

    it('updateRideWithGuards deve validar status antes de atualizar', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockRideRepository.update.mockResolvedValue({ ...mockRide, notes: 'Updated' });

      const result = await service.updateRideWithGuards(
        'ride-123',
        { notes: 'Updated' },
        { statusEq: 'pending' }
      );

      expect(result).toBe(true);
      expect(mockRideRepository.update).toHaveBeenCalled();
    });

    it('updateRideWithGuards deve retornar false se guard falhar', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      const result = await service.updateRideWithGuards(
        'ride-123',
        { notes: 'Updated' },
        { statusEq: 'completed' } // mockRide tem status 'pending'
      );

      expect(result).toBe(false);
      expect(mockRideRepository.update).not.toHaveBeenCalled();
    });

    it('countRidesByStatus deve contar rides por status', async () => {
      mockRideRepository.countByStatus.mockResolvedValue(10);

      const result = await service.countRidesByStatus('pending');

      expect(result).toBe(10);
      expect(mockRideRepository.countByStatus).toHaveBeenCalledWith('pending');
    });
  });

  // ============================================================================
  // DRIVER OPERATIONS TESTS
  // ============================================================================

  describe('Driver Operations', () => {
    it('getDriverById deve buscar driver por ID', async () => {
      mockDriverRepository.findById.mockResolvedValue(mockDriver);

      const result = await service.getDriverById('driver-123');

      expect(result).toEqual(mockDriver);
      expect(mockDriverRepository.findById).toHaveBeenCalledWith('driver-123');
    });

    it('getDriverByProfileId deve buscar driver por profile_id', async () => {
      mockDriverRepository.findByProfileId.mockResolvedValue(mockDriver);

      const result = await service.getDriverByProfileId('profile-456');

      expect(result).toEqual(mockDriver);
      expect(mockDriverRepository.findByProfileId).toHaveBeenCalledWith('profile-456');
    });

    it('getAvailableDrivers deve buscar motoristas disponíveis', async () => {
      mockDriverRepository.findAvailable.mockResolvedValue([mockDriver]);

      const result = await service.getAvailableDrivers();

      expect(result).toEqual([mockDriver]);
      expect(mockDriverRepository.findAvailable).toHaveBeenCalled();
    });

    it('getAvailableDriversInArea deve buscar motoristas em área', async () => {
      mockDriverRepository.findAvailableInArea.mockResolvedValue([mockDriver]);

      const result = await service.getAvailableDriversInArea(-23.5505, -46.6333, 5);

      expect(result).toEqual([mockDriver]);
      expect(mockDriverRepository.findAvailableInArea).toHaveBeenCalledWith(-23.5505, -46.6333, 5);
    });

    it('updateDriverAvailability deve atualizar disponibilidade', async () => {
      const updated = { ...mockDriver, is_available: false };
      mockDriverRepository.updateAvailability.mockResolvedValue(updated);

      const result = await service.updateDriverAvailability('driver-123', false);

      expect(result).toEqual(updated);
      expect(mockDriverRepository.updateAvailability).toHaveBeenCalledWith('driver-123', false);
    });

    it('updateDriverLocation deve atualizar localização', async () => {
      const updated = { ...mockDriver, current_lat: -23.5629, current_lng: -46.6544 };
      mockDriverRepository.updateLocation.mockResolvedValue(updated);

      const result = await service.updateDriverLocation('driver-123', -23.5629, -46.6544);

      expect(result).toEqual(updated);
      expect(mockDriverRepository.updateLocation).toHaveBeenCalledWith('driver-123', -23.5629, -46.6544);
    });

    it('incrementDriverRides deve incrementar total de corridas', async () => {
      const updated = { ...mockDriver, total_rides: 151 };
      mockDriverRepository.incrementTotalRides.mockResolvedValue(updated);

      const result = await service.incrementDriverRides('driver-123');

      expect(result).toEqual(updated);
      expect(mockDriverRepository.incrementTotalRides).toHaveBeenCalledWith('driver-123');
    });

    it('incrementDriverEarnings deve incrementar ganhos', async () => {
      const updated = { ...mockDriver, total_earnings: 5025.50 };
      mockDriverRepository.incrementEarnings.mockResolvedValue(updated);

      const result = await service.incrementDriverEarnings('driver-123', 25.50);

      expect(result).toEqual(updated);
      expect(mockDriverRepository.incrementEarnings).toHaveBeenCalledWith('driver-123', 25.50);
    });

    it('getTopDrivers deve buscar top motoristas', async () => {
      mockDriverRepository.findTopByRating.mockResolvedValue([mockDriver]);

      const result = await service.getTopDrivers(10);

      expect(result).toEqual([mockDriver]);
      expect(mockDriverRepository.findTopByRating).toHaveBeenCalledWith(10);
    });

    it('suspendDriver deve suspender motorista', async () => {
      const updated = { ...mockDriver, status: 'suspended' as const };
      mockDriverRepository.suspend.mockResolvedValue(updated);

      const result = await service.suspendDriver('driver-123');

      expect(result).toEqual(updated);
      expect(mockDriverRepository.suspend).toHaveBeenCalledWith('driver-123');
    });

    it('reactivateDriver deve reativar motorista', async () => {
      const updated = { ...mockDriver, status: 'active' as const };
      mockDriverRepository.reactivate.mockResolvedValue(updated);

      const result = await service.reactivateDriver('driver-123');

      expect(result).toEqual(updated);
      expect(mockDriverRepository.reactivate).toHaveBeenCalledWith('driver-123');
    });
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('Statistics', () => {
    it('getMobilityStats deve retornar estatísticas completas', async () => {
      mockDriverRepository.count.mockResolvedValue(100);
      mockRideRepository.count.mockResolvedValue(500);
      mockDriverRepository.countAvailable.mockResolvedValue(25);
      mockRideRepository.countByStatus.mockResolvedValue(10);

      const result = await service.getMobilityStats();

      expect(result).toEqual({
        total_drivers: 100,
        total_rides: 500,
        active_drivers: 25,
        active_rides: 10,
      });
    });

    it('getMobilityStats deve retornar zeros em caso de erro', async () => {
      mockDriverRepository.count.mockRejectedValue(new Error('Database error'));

      const result = await service.getMobilityStats();

      expect(result).toEqual({
        total_drivers: 0,
        total_rides: 0,
        active_drivers: 0,
        active_rides: 0,
      });
    });

    it('getDriverEarnings deve retornar rides completadas', async () => {
      const completedRide = { ...mockRide, status: 'completed' as RideStatus, completed_at: '2026-05-30T12:00:00Z' };
      mockRideRepository.findByDriverId.mockResolvedValue([completedRide]);

      const result = await service.getDriverEarnings('driver-789');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        final_price: completedRide.price,
        completed_at: completedRide.completed_at,
        updated_at: completedRide.updated_at,
      });
    });

    it('getDriverRideSessions deve retornar sessões de corrida', async () => {
      const rideWithSession = {
        ...mockRide,
        started_at: '2026-05-30T10:00:00Z',
        completed_at: '2026-05-30T10:30:00Z',
      };
      mockRideRepository.findByDriverId.mockResolvedValue([rideWithSession]);

      const result = await service.getDriverRideSessions('driver-789', 300);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        started_at: rideWithSession.started_at,
        completed_at: rideWithSession.completed_at,
      });
    });
  });
});
