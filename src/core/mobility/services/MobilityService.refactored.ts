/**
 * MobilityService.refactored - SSOT de mobilidade usando Repository Pattern
 * 
 * Versão refatorada do MobilityService que usa RideRepository e DriverRepository
 * ao invés de queries diretas ao Supabase.
 * 
 * SSOT: Única fonte de verdade para operações de mobilidade
 * Desacoplado do Supabase através do Repository Pattern
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import {
  RideRepository,
  DriverRepository,
  type Ride,
  type Driver,
  type RideStatus,
} from '@/core/infrastructure/database';
import { logger } from '@/shared/utils/logger';
import { RIDE_STATUS } from '../constants';

/**
 * Service de Mobilidade Refatorado
 * 
 * Substitui queries diretas por chamadas aos repositories
 * Mantém mesma interface pública para compatibilidade
 */
export class MobilityServiceRefactored {
  private rideRepository: RideRepository;
  private driverRepository: DriverRepository;

  constructor() {
    this.rideRepository = new RideRepository();
    this.driverRepository = new DriverRepository();
  }

  // ============================================================================
  // RIDE OPERATIONS
  // ============================================================================

  /**
   * Busca ride por ID
   */
  async getRideById(id: string): Promise<Ride | null> {
    try {
      return await this.rideRepository.findById(id);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getRideById', error as Error);
      return null;
    }
  }

  /**
   * Cria nova ride
   */
  async createRide(data: Partial<Ride>): Promise<Ride> {
    return await this.rideRepository.create(data);
  }

  /**
   * Atualiza ride
   */
  async updateRide(rideId: string, updates: Partial<Ride>): Promise<Ride> {
    return await this.rideRepository.update(rideId, updates);
  }

  /**
   * Busca todas as rides
   */
  async getAllRideRequests(): Promise<Ride[]> {
    const orderBy = [{ field: 'created_at', direction: 'asc' as const }];
    return await this.rideRepository.findAll([], orderBy);
  }

  /**
   * Busca rides por passageiro
   */
  async getRidesByPassenger(passengerProfileId: string): Promise<Ride[]> {
    return await this.rideRepository.findByPassengerId(passengerProfileId);
  }

  /**
   * Busca rides por motorista
   */
  async getRidesByDriverProfile(driverProfileId: string): Promise<Ride[]> {
    return await this.rideRepository.findByDriverId(driverProfileId);
  }

  /**
   * Busca ride ativa de um usuário (passageiro ou motorista)
   */
  async getActiveRide(userProfileId: string): Promise<Ride | null> {
    try {
      // Tenta como passageiro
      const asPassenger = await this.rideRepository.findActiveByPassengerId(userProfileId);
      if (asPassenger) return asPassenger;

      // Tenta como motorista
      const asDriver = await this.rideRepository.findActiveByDriverId(userProfileId);
      return asDriver;
    } catch (error) {
      logger.error('MobilityServiceRefactored.getActiveRide', error as Error);
      return null;
    }
  }

  /**
   * Busca ride ativa de motorista com filtros
   */
  async getActiveRideByDriverProfile(
    driverProfileId: string,
    statuses: RideStatus[],
    excludeRideId?: string
  ): Promise<Ride | null> {
    try {
      const rides = await this.rideRepository.findByDriverId(driverProfileId);
      
      const filtered = rides.filter(ride => {
        if (excludeRideId && ride.id === excludeRideId) return false;
        return statuses.includes(ride.status);
      });

      return filtered[0] || null;
    } catch (error) {
      logger.error('MobilityServiceRefactored.getActiveRideByDriverProfile', error as Error);
      return null;
    }
  }

  /**
   * Busca rides ativas
   */
  async getActiveRides(): Promise<Ride[]> {
    try {
      return await this.rideRepository.findInProgress();
    } catch (error) {
      logger.error('MobilityServiceRefactored.getActiveRides', error as Error);
      return [];
    }
  }

  /**
   * Busca rides recentes
   */
  async getRecentRides(limit: number = 50): Promise<Ride[]> {
    try {
      return await this.rideRepository.findRecent(limit);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getRecentRides', error as Error);
      return [];
    }
  }

  /**
   * Busca rides por período
   */
  async getRidesByPeriod(startDate: Date, endDate: Date): Promise<Ride[]> {
    try {
      return await this.rideRepository.findByPeriod(startDate, endDate);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getRidesByPeriod', error as Error);
      return [];
    }
  }

  /**
   * Busca rides em área geográfica
   */
  async getRidesInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Ride[]> {
    try {
      return await this.rideRepository.findInArea(centerLat, centerLng, radiusKm);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getRidesInArea', error as Error);
      return [];
    }
  }

  /**
   * Atribui motorista à ride
   */
  async assignDriver(rideId: string, driverProfileId: string): Promise<Ride> {
    return await this.rideRepository.assignDriver(rideId, driverProfileId);
  }

  /**
   * Inicia ride
   */
  async startRide(rideId: string): Promise<Ride> {
    return await this.rideRepository.startRide(rideId);
  }

  /**
   * Completa ride
   */
  async completeRide(
    rideId: string,
    finalPrice?: number,
    rating?: number
  ): Promise<Ride> {
    return await this.rideRepository.completeRide(rideId, finalPrice, rating);
  }

  /**
   * Cancela ride
   */
  async cancelRide(rideId: string, reason: string): Promise<Ride> {
    return await this.rideRepository.cancelRide(rideId, reason);
  }

  /**
   * Atualiza status da ride
   */
  async updateRideStatus(
    rideId: string,
    status: RideStatus,
    metadata?: Record<string, any>
  ): Promise<Ride> {
    return await this.rideRepository.updateStatus(rideId, status, metadata);
  }

  /**
   * Atualiza ride com guards (validações)
   */
  async updateRideWithGuards(
    rideId: string,
    updates: Partial<Ride>,
    guards: {
      statusEq?: RideStatus;
      driverProfileIdEq?: string;
    } = {}
  ): Promise<boolean> {
    try {
      const ride = await this.rideRepository.findById(rideId);
      if (!ride) return false;

      // Validar guards
      if (guards.statusEq && ride.status !== guards.statusEq) {
        return false;
      }

      if (guards.driverProfileIdEq && ride.driver_id !== guards.driverProfileIdEq) {
        return false;
      }

      // Atualizar
      await this.rideRepository.update(rideId, updates);
      return true;
    } catch (error) {
      logger.error('MobilityServiceRefactored.updateRideWithGuards', error as Error);
      return false;
    }
  }

  /**
   * Atualiza ride se status estiver em lista permitida
   */
  async updateRideIfStatusIn(
    rideId: string,
    updates: Partial<Ride>,
    allowedStatuses: RideStatus[]
  ): Promise<boolean> {
    try {
      const ride = await this.rideRepository.findById(rideId);
      if (!ride) return false;

      if (!allowedStatuses.includes(ride.status)) {
        return false;
      }

      await this.rideRepository.update(rideId, updates);
      return true;
    } catch (error) {
      logger.error('MobilityServiceRefactored.updateRideIfStatusIn', error as Error);
      return false;
    }
  }

  /**
   * Conta rides por status
   */
  async countRidesByStatus(status: RideStatus): Promise<number> {
    try {
      return await this.rideRepository.countByStatus(status);
    } catch (error) {
      logger.error('MobilityServiceRefactored.countRidesByStatus', error as Error);
      return 0;
    }
  }

  /**
   * Conta rides de passageiro
   */
  async countRidesByPassenger(passengerId: string): Promise<number> {
    try {
      return await this.rideRepository.countByPassengerId(passengerId);
    } catch (error) {
      logger.error('MobilityServiceRefactored.countRidesByPassenger', error as Error);
      return 0;
    }
  }

  /**
   * Conta rides de motorista
   */
  async countRidesByDriver(driverProfileId: string): Promise<number> {
    try {
      return await this.rideRepository.countByDriverId(driverProfileId);
    } catch (error) {
      logger.error('MobilityServiceRefactored.countRidesByDriver', error as Error);
      return 0;
    }
  }

  // ============================================================================
  // DRIVER OPERATIONS
  // ============================================================================

  /**
   * Busca driver por ID
   */
  async getDriverById(id: string): Promise<Driver | null> {
    try {
      return await this.driverRepository.findById(id);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getDriverById', error as Error);
      return null;
    }
  }

  /**
   * Busca driver por profile_id
   */
  async getDriverByProfileId(profileId: string): Promise<Driver | null> {
    try {
      return await this.driverRepository.findByProfileId(profileId);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getDriverByProfileId', error as Error);
      return null;
    }
  }

  /**
   * Busca motoristas disponíveis
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      return await this.driverRepository.findAvailable();
    } catch (error) {
      logger.error('MobilityServiceRefactored.getAvailableDrivers', error as Error);
      return [];
    }
  }

  /**
   * Busca motoristas disponíveis em área
   */
  async getAvailableDriversInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Driver[]> {
    try {
      return await this.driverRepository.findAvailableInArea(
        centerLat,
        centerLng,
        radiusKm
      );
    } catch (error) {
      logger.error('MobilityServiceRefactored.getAvailableDriversInArea', error as Error);
      return [];
    }
  }

  /**
   * Atualiza disponibilidade do motorista
   */
  async updateDriverAvailability(
    driverDataId: string,
    isAvailable: boolean
  ): Promise<Driver> {
    return await this.driverRepository.updateAvailability(driverDataId, isAvailable);
  }

  /**
   * Atualiza localização do motorista
   */
  async updateDriverLocation(
    driverDataId: string,
    lat: number,
    lng: number
  ): Promise<Driver> {
    return await this.driverRepository.updateLocation(driverDataId, lat, lng);
  }

  /**
   * Incrementa total de corridas do motorista
   */
  async incrementDriverRides(driverDataId: string): Promise<Driver> {
    return await this.driverRepository.incrementTotalRides(driverDataId);
  }

  /**
   * Incrementa ganhos do motorista
   */
  async incrementDriverEarnings(driverDataId: string, amount: number): Promise<Driver> {
    return await this.driverRepository.incrementEarnings(driverDataId, amount);
  }

  /**
   * Atualiza rating do motorista
   */
  async updateDriverRating(driverDataId: string, newRating: number): Promise<Driver> {
    return await this.driverRepository.updateRating(driverDataId, newRating);
  }

  /**
   * Busca top motoristas por rating
   */
  async getTopDrivers(limit: number = 10): Promise<Driver[]> {
    try {
      return await this.driverRepository.findTopByRating(limit);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getTopDrivers', error as Error);
      return [];
    }
  }

  /**
   * Busca motoristas por tipo de veículo
   */
  async getDriversByVehicleType(vehicleType: string): Promise<Driver[]> {
    try {
      return await this.driverRepository.findByVehicleType(vehicleType);
    } catch (error) {
      logger.error('MobilityServiceRefactored.getDriversByVehicleType', error as Error);
      return [];
    }
  }

  /**
   * Conta motoristas disponíveis
   */
  async countAvailableDrivers(): Promise<number> {
    try {
      return await this.driverRepository.countAvailable();
    } catch (error) {
      logger.error('MobilityServiceRefactored.countAvailableDrivers', error as Error);
      return 0;
    }
  }

  /**
   * Suspende motorista
   */
  async suspendDriver(driverDataId: string): Promise<Driver> {
    return await this.driverRepository.suspend(driverDataId);
  }

  /**
   * Reativa motorista
   */
  async reactivateDriver(driverDataId: string): Promise<Driver> {
    return await this.driverRepository.reactivate(driverDataId);
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Busca estatísticas de mobilidade
   */
  async getMobilityStats(): Promise<{
    total_drivers: number;
    total_rides: number;
    active_drivers: number;
    active_rides: number;
  }> {
    try {
      const [totalDrivers, totalRides, activeDrivers, activeRides] = await Promise.all([
        this.driverRepository.count([]),
        this.rideRepository.count([]),
        this.driverRepository.countAvailable(),
        this.rideRepository.countByStatus('in_progress'),
      ]);

      return {
        total_drivers: totalDrivers,
        total_rides: totalRides,
        active_drivers: activeDrivers,
        active_rides: activeRides,
      };
    } catch (error) {
      logger.error('MobilityServiceRefactored.getMobilityStats', error as Error);
      return {
        total_drivers: 0,
        total_rides: 0,
        active_drivers: 0,
        active_rides: 0,
      };
    }
  }

  /**
   * Busca ganhos do motorista (rides completadas)
   */
  async getDriverEarnings(driverProfileId: string): Promise<Array<{
    final_price: number | null;
    completed_at: string | null;
    updated_at: string;
  }>> {
    try {
      const rides = await this.rideRepository.findByDriverId(driverProfileId);
      
      const completed = rides
        .filter(ride => ride.status === 'completed')
        .map(ride => ({
          final_price: ride.price,
          completed_at: ride.completed_at,
          updated_at: ride.updated_at,
        }));

      return completed;
    } catch (error) {
      logger.error('MobilityServiceRefactored.getDriverEarnings', error as Error);
      return [];
    }
  }

  /**
   * Busca sessões de corrida do motorista
   */
  async getDriverRideSessions(
    driverProfileId: string,
    limit: number = 300
  ): Promise<Array<{ started_at: string | null; completed_at: string | null }>> {
    try {
      const rides = await this.rideRepository.findByDriverId(driverProfileId);
      
      const sessions = rides
        .filter(ride => ride.started_at && ride.completed_at)
        .slice(0, limit)
        .map(ride => ({
          started_at: ride.started_at,
          completed_at: ride.completed_at,
        }));

      return sessions;
    } catch (error) {
      logger.error('MobilityServiceRefactored.getDriverRideSessions', error as Error);
      return [];
    }
  }
}

// Singleton instance
export const mobilityServiceRefactored = new MobilityServiceRefactored();
