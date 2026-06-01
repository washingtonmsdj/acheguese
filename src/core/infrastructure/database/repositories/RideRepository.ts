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
export interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address: string;
  status: RideStatus;
  price: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  payment_method: string | null;
  payment_status: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

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
  async findByPassengerId(passengerId: string): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('passenger_id', 'eq', passengerId),
    ];

    const orderBy = [this.createOrderBy('created_at', 'desc')];

    return this.findAll(filters, orderBy);
  }

  /**
   * Busca rides por motorista
   */
  async findByDriverId(driverProfileId: string): Promise<Ride[]> {
    const filters: Filter[] = [
      this.createFilter('driver_id', 'eq', driverProfileId),
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
  async findActiveByPassengerId(passengerId: string): Promise<Ride | null> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('passenger_id', passengerId)
        .in('status', ['pending', 'searching', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw DatabaseError.fromSupabaseError(error, 'findActiveByPassengerId', this.table);
      }

      return data as Ride | null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: `Failed to find active ride for passenger: ${passengerId}`,
        originalError: error,
        table: this.table,
        operation: 'findActiveByPassengerId',
        context: { passengerId },
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
        .eq('driver_id', driverProfileId)
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
  async countByPassengerId(passengerId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('passenger_id', 'eq', passengerId),
    ];

    return this.count(filters);
  }

  /**
   * Conta rides de um motorista
   */
  async countByDriverId(driverProfileId: string): Promise<number> {
    const filters: Filter[] = [
      this.createFilter('driver_id', 'eq', driverProfileId),
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
        .gte('pickup_lat', centerLat - latDelta)
        .lte('pickup_lat', centerLat + latDelta)
        .gte('pickup_lng', centerLng - lngDelta)
        .lte('pickup_lng', centerLng + lngDelta);

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
    metadata?: Record<string, any>
  ): Promise<Ride> {
    const updates: Partial<Ride> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Adicionar timestamps específicos por status
    if (status === 'accepted' && !metadata?.accepted_at) {
      updates.accepted_at = new Date().toISOString();
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
    return this.updateStatus(rideId, 'accepted', {
      driver_id: driverProfileId,
      accepted_at: new Date().toISOString(),
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
    finalPrice?: number,
    rating?: number
  ): Promise<Ride> {
    return this.updateStatus(rideId, 'completed', {
      completed_at: new Date().toISOString(),
      price: finalPrice,
      rating,
    });
  }

  /**
   * Cancela ride
   */
  async cancelRide(rideId: string, reason: string): Promise<Ride> {
    return this.updateStatus(rideId, 'cancelled', {
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
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
