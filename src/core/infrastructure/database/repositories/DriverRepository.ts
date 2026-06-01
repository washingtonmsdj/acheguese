/**
 * DriverRepository - Repository para tabela driver_data
 * 
 * SSOT: Única fonte de verdade para operações com motoristas
 * Substitui queries diretas espalhadas em múltiplos arquivos
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { supabase } from '@/integrations/supabase';
import { BaseRepository } from './BaseRepository';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter } from '../interfaces/IRepository';
import {
  DATABASE_DRIVER_STATUS,
  type DatabaseDriverStatus,
} from '../constants/statuses';

/**
 * Interface do Driver (SSOT)
 * Define estrutura canônica de um motorista
 */
export interface Driver {
  id: string;
  profile_id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_number: string | null;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number | null;
  total_rides: number;
  total_earnings: number;
  status: DatabaseDriverStatus | null;
  created_at: string;
  updated_at: string;
  last_location_update: string | null;
}

/**
 * Repository para operações com motoristas
 * Herda todas as operações CRUD do BaseRepository
 * Adiciona métodos específicos do domínio de motoristas
 */
export class DriverRepository extends BaseRepository<Driver> {
  protected readonly table = 'driver_data';

  constructor() {
    super(supabase);
  }

  /**
   * Busca driver por profile_id
   */
  async findByProfileId(profileId: string): Promise<Driver | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByProfileId', this.table);
      }

      return data as Driver | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find driver by profile_id: ${profileId}`,
        originalError: error,
        table: this.table,
        operation: 'findByProfileId',
        context: { profileId },
      });
    }
  }

  /**
   * Busca motoristas disponíveis
   */
  async findAvailable(): Promise<Driver[]> {
    const filters: Filter[] = [
      this.createFilter('is_available', 'eq', true),
      this.createFilter('status', 'eq', DATABASE_DRIVER_STATUS.ACTIVE),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca motoristas disponíveis em área geográfica
   */
  async findAvailableInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Driver[]> {
    try {
      // Cálculo aproximado de bounding box
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));

      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('is_available', true)
        .eq('status', DATABASE_DRIVER_STATUS.ACTIVE)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null)
        .gte('current_lat', centerLat - latDelta)
        .lte('current_lat', centerLat + latDelta)
        .gte('current_lng', centerLng - lngDelta)
        .lte('current_lng', centerLng + lngDelta);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findAvailableInArea', this.table);
      }

      return (data as Driver[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find available drivers in area`,
        originalError: error,
        table: this.table,
        operation: 'findAvailableInArea',
        context: { centerLat, centerLng, radiusKm },
      });
    }
  }

  /**
   * Atualiza disponibilidade do motorista
   */
  async updateAvailability(
    driverDataId: string,
    isAvailable: boolean
  ): Promise<Driver> {
    return this.update(driverDataId, {
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    } as Partial<Driver>);
  }

  /**
   * Atualiza localização do motorista
   */
  async updateLocation(
    driverDataId: string,
    lat: number,
    lng: number
  ): Promise<Driver> {
    return this.update(driverDataId, {
      current_lat: lat,
      current_lng: lng,
      last_location_update: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Partial<Driver>);
  }

  /**
   * Incrementa total de corridas
   */
  async incrementTotalRides(driverDataId: string): Promise<Driver> {
    try {
      const driver = await this.findById(driverDataId);
      if (!driver) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Driver not found: ${driverDataId}`,
          table: this.table,
          operation: 'incrementTotalRides',
          context: { driverDataId },
        });
      }

      return this.update(driverDataId, {
        total_rides: driver.total_rides + 1,
        updated_at: new Date().toISOString(),
      } as Partial<Driver>);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to increment total rides for driver: ${driverDataId}`,
        originalError: error,
        table: this.table,
        operation: 'incrementTotalRides',
        context: { driverDataId },
      });
    }
  }

  /**
   * Incrementa ganhos totais
   */
  async incrementEarnings(driverDataId: string, amount: number): Promise<Driver> {
    try {
      const driver = await this.findById(driverDataId);
      if (!driver) {
        throw new DatabaseError({
          code: DatabaseErrorCode.NOT_FOUND,
          message: `Driver not found: ${driverDataId}`,
          table: this.table,
          operation: 'incrementEarnings',
          context: { driverDataId },
        });
      }

      return this.update(driverDataId, {
        total_earnings: driver.total_earnings + amount,
        updated_at: new Date().toISOString(),
      } as Partial<Driver>);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to increment earnings for driver: ${driverDataId}`,
        originalError: error,
        table: this.table,
        operation: 'incrementEarnings',
        context: { driverDataId, amount },
      });
    }
  }

  /**
   * Atualiza rating do motorista
   */
  async updateRating(driverDataId: string, newRating: number): Promise<Driver> {
    return this.update(driverDataId, {
      rating: newRating,
      updated_at: new Date().toISOString(),
    } as Partial<Driver>);
  }

  /**
   * Busca motoristas por status
   */
  async findByStatus(status: DatabaseDriverStatus): Promise<Driver[]> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca top motoristas por rating
   */
  async findTopByRating(limit: number = 10): Promise<Driver[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('status', DATABASE_DRIVER_STATUS.ACTIVE)
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findTopByRating', this.table);
      }

      return (data as Driver[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find top drivers by rating`,
        originalError: error,
        table: this.table,
        operation: 'findTopByRating',
        context: { limit },
      });
    }
  }

  /**
   * Busca motoristas por tipo de veículo
   */
  async findByVehicleType(vehicleType: string): Promise<Driver[]> {
    const filters: Filter[] = [
      this.createFilter('vehicle_type', 'eq', vehicleType),
      this.createFilter('status', 'eq', DATABASE_DRIVER_STATUS.ACTIVE),
    ];

    return this.findAll(filters);
  }

  /**
   * Conta motoristas disponíveis
   */
  async countAvailable(): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('is_available', 'eq', true),
      this.createFilter('status', 'eq', DATABASE_DRIVER_STATUS.ACTIVE),
    ];

    return this.count(filters);
  }

  /**
   * Suspende motorista
   */
  async suspend(driverDataId: string): Promise<Driver> {
    return this.update(driverDataId, {
      status: DATABASE_DRIVER_STATUS.SUSPENDED,
      is_available: false,
      updated_at: new Date().toISOString(),
    } as Partial<Driver>);
  }

  /**
   * Reativa motorista
   */
  async reactivate(driverDataId: string): Promise<Driver> {
    return this.update(driverDataId, {
      status: DATABASE_DRIVER_STATUS.ACTIVE,
      updated_at: new Date().toISOString(),
    } as Partial<Driver>);
  }
}
