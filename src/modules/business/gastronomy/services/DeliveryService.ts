/**
 * DeliveryService — SSOT canônico de entregas
 *
 * Centraliza toda a lógica de negócio de entregas via rede de motoboys.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - CRUD de solicitações de entrega
 * - Gerenciamento de status
 * - Aceite por motoboys
 * - Rastreamento em tempo real
 * - Estatísticas
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { TRUST_ACTOR_ROLES, TrustEventService } from '@/core/trust';

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type DeliveryRequestStatus =
  | 'pending'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryRequest {
  id: string;
  order_id: string;
  business_id: string;
  driver_profile_id: string | null;
  status: DeliveryRequestStatus;
  request_number: number;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  customer_name: string;
  customer_phone: string;
  delivery_fee: number;
  driver_payment: number | null;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  pickup_instructions: string | null;
  delivery_instructions: string | null;
  internal_notes: string | null;
  requested_at: string;
  accepted_at: string | null;
  picked_up_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  failure_reason: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryStatusHistory {
  id: string;
  delivery_request_id: string;
  from_status: DeliveryRequestStatus | null;
  to_status: DeliveryRequestStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DeliveryTracking {
  id: string;
  delivery_request_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed_kmh: number | null;
  heading: number | null;
  battery_level: number | null;
  created_at: string;
}

export interface DeliveryRequestWithHistory extends DeliveryRequest {
  status_history: DeliveryStatusHistory[];
  tracking: DeliveryTracking[];
}

export interface AvailableDelivery {
  id: string;
  business_id: string;
  request_number: number;
  pickup_address: string;
  delivery_address: string;
  customer_name: string;
  delivery_fee: number;
  driver_payment: number | null;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  distance_from_driver_km: number;
  requested_at: string;
}

export interface DeliveryStats {
  total_requests: number;
  pending_requests: number;
  accepted_requests: number;
  in_progress_requests: number;
  delivered_requests: number;
  failed_requests: number;
  cancelled_requests: number;
  total_delivery_fees: number;
  average_delivery_time_minutes: number;
}

// ── Service ───────────────────────────────────────────────────────────────

export const DeliveryService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // SOLICITAÇÕES DE ENTREGA
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Lista solicitações de entrega de uma empresa
   */
  async listDeliveryRequests(
    businessId: string,
    filters?: {
      status?: DeliveryRequestStatus;
      date_from?: string;
      date_to?: string;
      limit?: number;
    }
  ): Promise<ServiceResult<DeliveryRequest[]>> {
    try {
      let query = supabase
        .from('delivery_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('requested_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('requested_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('requested_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[DeliveryService] listDeliveryRequests error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryRequest[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca uma solicitação específica com histórico e rastreamento
   */
  async getDeliveryRequest(requestId: string): Promise<ServiceResult<DeliveryRequestWithHistory>> {
    try {
      // Busca solicitação
      const { data: request, error: requestError } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        logger.error('[DeliveryService] getDeliveryRequest error', requestError);
        return { data: null, error: requestError.message };
      }

      // Busca histórico
      const { data: history } = await supabase
        .from('delivery_status_history')
        .select('*')
        .eq('delivery_request_id', requestId)
        .order('created_at', { ascending: true });

      // Busca rastreamento
      const { data: tracking } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_request_id', requestId)
        .order('created_at', { ascending: true });

      return {
        data: {
          ...(request as DeliveryRequest),
          status_history: (history || []) as DeliveryStatusHistory[],
          tracking: (tracking || []) as DeliveryTracking[],
        },
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria uma nova solicitação de entrega
   */
  async createDeliveryRequest(input: {
    order_id: string;
    business_id: string;
    pickup_address: string;
    pickup_lat?: number;
    pickup_lng?: number;
    delivery_address: string;
    delivery_lat?: number;
    delivery_lng?: number;
    customer_name: string;
    customer_phone: string;
    delivery_fee: number;
    driver_payment?: number;
    estimated_distance_km?: number;
    estimated_duration_minutes?: number;
    pickup_instructions?: string;
    delivery_instructions?: string;
  }): Promise<ServiceResult<DeliveryRequest>> {
    try {
      // Busca próximo número de solicitação
      const { data: nextNumber, error: numberError } = await supabase.rpc(
        'get_next_delivery_request_number',
        { p_business_id: input.business_id }
      );

      if (numberError) {
        logger.error('[DeliveryService] get_next_delivery_request_number error', numberError);
        return { data: null, error: numberError.message };
      }

      // Cria solicitação
      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          order_id: input.order_id,
          business_id: input.business_id,
          request_number: nextNumber,
          pickup_address: input.pickup_address,
          pickup_lat: input.pickup_lat || null,
          pickup_lng: input.pickup_lng || null,
          delivery_address: input.delivery_address,
          delivery_lat: input.delivery_lat || null,
          delivery_lng: input.delivery_lng || null,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          delivery_fee: input.delivery_fee,
          driver_payment: input.driver_payment || null,
          estimated_distance_km: input.estimated_distance_km || null,
          estimated_duration_minutes: input.estimated_duration_minutes || null,
          pickup_instructions: input.pickup_instructions || null,
          delivery_instructions: input.delivery_instructions || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryService] createDeliveryRequest error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryRequest, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza status de uma solicitação
   */
  async updateDeliveryStatus(
    requestId: string,
    status: DeliveryRequestStatus,
    notes?: string
  ): Promise<ServiceResult<DeliveryRequest>> {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .update({ status })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryService] updateDeliveryStatus error', error);
        return { data: null, error: error.message };
      }

      // Adiciona nota ao histórico se fornecida
      if (notes) {
        await supabase
          .from('delivery_status_history')
          .update({ notes })
          .eq('delivery_request_id', requestId)
          .eq('to_status', status)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      return { data: data as DeliveryRequest, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cancela uma solicitação
   */
  async cancelDeliveryRequest(
    requestId: string,
    reason: string
  ): Promise<ServiceResult<DeliveryRequest>> {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryService] cancelDeliveryRequest error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryRequest, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MOTOBOYS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Busca entregas disponíveis para motoboys
   */
  async getAvailableDeliveries(
    driverLat: number,
    driverLng: number,
    radiusKm: number = 10
  ): Promise<ServiceResult<AvailableDelivery[]>> {
    try {
      const { data, error } = await supabase.rpc('get_available_deliveries', {
        p_driver_lat: driverLat,
        p_driver_lng: driverLng,
        p_radius_km: radiusKm,
      });

      if (error) {
        logger.error('[DeliveryService] getAvailableDeliveries error', error);
        return { data: null, error: error.message };
      }

      return { data: data as AvailableDelivery[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Aceita uma solicitação de entrega
   */
  async acceptDeliveryRequest(
    requestId: string,
    driverProfileId: string,
    driverPayment?: number
  ): Promise<ServiceResult<DeliveryRequest>> {
    try {
      const trustGate = await TrustEventService.canReceiveOperationalCall(
        driverProfileId,
        TRUST_ACTOR_ROLES.COURIER,
      );
      if (!trustGate.allowed) {
        return {
          data: null,
          error: trustGate.reason || 'Motoboy bloqueado para novas entregas ate revisao admin.',
        };
      }

      const { data, error } = await supabase
        .from('delivery_requests')
        .update({
          status: 'accepted',
          driver_profile_id: driverProfileId,
          driver_payment: driverPayment || null,
        })
        .eq('id', requestId)
        .eq('status', 'pending') // Só aceita se ainda estiver pendente
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryService] acceptDeliveryRequest error', error);
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: null, error: 'Entrega não está mais disponível' };
      }

      return { data: data as DeliveryRequest, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Lista entregas de um motoboy
   */
  async listDriverDeliveries(
    driverProfileId: string,
    filters?: {
      status?: DeliveryRequestStatus;
      date_from?: string;
      date_to?: string;
      limit?: number;
    }
  ): Promise<ServiceResult<DeliveryRequest[]>> {
    try {
      let query = supabase
        .from('delivery_requests')
        .select('*')
        .eq('driver_profile_id', driverProfileId)
        .order('requested_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('requested_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('requested_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[DeliveryService] listDriverDeliveries error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryRequest[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RASTREAMENTO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Adiciona ponto de rastreamento
   */
  async addTrackingPoint(input: {
    delivery_request_id: string;
    lat: number;
    lng: number;
    accuracy?: number;
    speed_kmh?: number;
    heading?: number;
    battery_level?: number;
  }): Promise<ServiceResult<DeliveryTracking>> {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .insert({
          delivery_request_id: input.delivery_request_id,
          lat: input.lat,
          lng: input.lng,
          accuracy: input.accuracy || null,
          speed_kmh: input.speed_kmh || null,
          heading: input.heading || null,
          battery_level: input.battery_level || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryService] addTrackingPoint error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryTracking, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca último ponto de rastreamento
   */
  async getLastTrackingPoint(requestId: string): Promise<ServiceResult<DeliveryTracking>> {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        logger.error('[DeliveryService] getLastTrackingPoint error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryTracking, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna estatísticas de entregas
   */
  async getDeliveryStats(
    businessId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceResult<DeliveryStats>> {
    try {
      const { data, error } = await supabase.rpc('get_delivery_stats', {
        p_business_id: businessId,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null,
      });

      if (error) {
        logger.error('[DeliveryService] getDeliveryStats error', error);
        return { data: null, error: error.message };
      }

      return { data: data[0] as DeliveryStats, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};


