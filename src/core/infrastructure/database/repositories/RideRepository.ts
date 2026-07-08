/**
 * RideRepository - Repository para tabela ride_requests
 * 
 * SSOT: Única fonte de verdade para operações com rides
 * Substitui queries diretas espalhadas em 20+ arquivos do módulo mobility
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { supabase } from '@/integrations/supabase';
import { BaseRepository } from './BaseRepository';
import { DatabaseError, DatabaseErrorCode } from '../errors/DatabaseError';
import type { Filter } from '../interfaces/IRepository';
import type { Tables } from '@/integrations/supabase';

/**
 * Status possíveis de uma ride
 */
export type RideStatus = 
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Interface do Ride (SSOT)
 * Define estrutura canônica de uma ride
 */
export type Ride = Tables<'ride_requests'>;

/**
 * Repository para operações com rides
 * Herda todas as operações CRUD do BaseRepository
 * Adiciona métodos específicos do domínio de mobilidade
 */
export class RideRepository extends BaseRepository<Ride> {
  protected readonly table = 'ride_requests';

  constructor() {
    super(supabase);
  }

  /**
   * Busca rides por passageiro
   */
  async findByPassengerProfileId(passengerProfileId: string): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('passenger_profile_id', 'eq', passengerProfileId),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca rides por motorista
   */
  async findByDriverId(driverProfileId: string): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('driver_profile_id', 'eq', driverProfileId),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca rides por status
   */
  async findByStatus(status: RideStatus): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca rides pendentes (aguardando motorista)
   */
  async findPending(): Promise<Ride[]> {
    return this.findByStatus('pending');
  }

  /**
   * Busca rides em progresso
   */
  async findInProgress(): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('status', 'in', ['accepted', 'in_progress']),
    ];

    return this.findAll(filters);
  }

  /**
   * Busca rides completadas
   */
  async findCompleted(): Promise<Ride[]> {
    return this.findByStatus('completed');
  }

  /**
   * Busca rides canceladas
   */
  async findCancelled(): Promise<Ride[]> {
    return this.findByStatus('cancelled');
  }

  /**
   * Busca ride ativa de um passageiro
   * (apenas 1 ride ativa por passageiro)
   */
  async findActiveByPassengerProfileId(passengerProfileId: string): Promise<Ride | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('passenger_profile_id', passengerProfileId)
        .in('status', ['pending', 'searching', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findActiveByPassengerProfileId', this.table);
      }

      return data as Ride | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find active ride for passenger profile: ${passengerProfileId}`,
        originalError: error,
        table: this.table,
        operation: 'findActiveByPassengerProfileId',
        context: { passengerProfileId },
      });
    }
  }

  /**
   * Busca ride ativa de um motorista
   */
  async findActiveByDriverId(driverProfileId: string): Promise<Ride | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('driver_profile_id', driverProfileId)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findActiveByDriverId', this.table);
      }

      return data as Ride | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find active ride for driver: ${driverProfileId}`,
        originalError: error,
        table: this.table,
        operation: 'findActiveByDriverId',
        context: { driverProfileId },
      });
    }
  }

  /**
   * Conta rides por status
   */
  async countByStatus(status: RideStatus): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('status', 'eq', status),
    ];

    return this.count(filters);
  }

  /**
   * Conta rides de um passageiro
   */
  async countByPassengerProfileId(passengerProfileId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('passenger_profile_id', 'eq', passengerProfileId),
    ];

    return this.count(filters);
  }

  /**
   * Conta rides de um motorista
   */
  async countByDriverId(driverProfileId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('driver_profile_id', 'eq', driverProfileId),
    ];

    return this.count(filters);
  }

  /**
   * Busca rides em área geográfica
   */
  async findInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Ride[]> {
    try {
      // Cálculo aproximado de bounding box
      const latDelta = radiusKm / 111; // 1 grau lat ≈ 111km
      const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));

      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .gte('origin_lat', centerLat - latDelta)
        .lte('origin_lat', centerLat + latDelta)
        .gte('origin_lng', centerLng - lngDelta)
        .lte('origin_lng', centerLng + lngDelta);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findInArea', this.table);
      }

      return (data as Ride[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find rides in area`,
        originalError: error,
        table: this.table,
        operation: 'findInArea',
        context: { centerLat, centerLng, radiusKm },
      });
    }
  }

  /**
   * Atualiza status da ride
   */
  async updateStatus(
    id: string,
    status: RideStatus,
    metadata?: Partial<Ride>
  ): Promise<Ride> {
    const updates: Partial<Ride> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Adicionar timestamps específicos por status
    if (status === 'accepted' && !metadata?.driver_accepted_at) {
      updates.driver_accepted_at = new Date().toISOString();
    } else if (status === 'in_progress' && !metadata?.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' && !metadata?.completed_at) {
      updates.completed_at = new Date().toISOString();
    } else if (status === 'cancelled' && !metadata?.cancelled_at) {
      updates.cancelled_at = new Date().toISOString();
    }

    // Adicionar metadata adicional
    if (metadata) {
      Object.assign(updates, metadata);
    }

    return this.update(id, updates);
  }

  /**
   * Atribui motorista à ride
   */
  async assignDriver(rideId: string, driverProfileId: string): Promise<Ride> {
    const assignedAt = new Date().toISOString();
    return this.updateStatus(rideId, 'accepted', {
      driver_profile_id: driverProfileId,
      driver_accepted_at: assignedAt,
      driver_assigned_at: assignedAt,
    });
  }

  /**
   * Inicia ride
   */
  async startRide(rideId: string): Promise<Ride> {
    return this.updateStatus(rideId, 'in_progress', {
      started_at: new Date().toISOString(),
    });
  }

  /**
   * Completa ride
   */
  async completeRide(
    rideId: string,
    finalPrice?: number
  ): Promise<Ride> {
    return this.updateStatus(rideId, 'completed', {
      completed_at: new Date().toISOString(),
      final_price: finalPrice,
    });
  }

  /**
   * Cancela ride
   */
  async cancelRide(rideId: string): Promise<Ride> {
    return this.updateStatus(rideId, 'cancelled', {
      cancelled_at: new Date().toISOString(),
    });
  }

  /**
   * Busca rides recentes (últimas 24h)
   */
  async findRecent(limit: number = 50): Promise<Ride[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findRecent', this.table);
      }

      return (data as Ride[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find recent rides`,
        originalError: error,
        table: this.table,
        operation: 'findRecent',
        context: { limit },
      });
    }
  }

  /**
   * Busca rides por período
   */
  async findByPeriod(startDate: Date, endDate: Date): Promise<Ride[]> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findByPeriod', this.table);
      }

      return (data as Ride[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find rides by period`,
        originalError: error,
        table: this.table,
        operation: 'findByPeriod',
        context: { startDate, endDate },
      });
    }
  }
}
