/**
 * DeliveryAreaService — SSOT canônico de áreas de entrega
 *
 * Centraliza toda a lógica de negócio de áreas de entrega e taxas.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - CRUD de áreas de entrega
 * - CRUD de bairros atendidos
 * - Validação de elegibilidade
 * - Cálculo de taxa e tempo
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type AreaType = 'neighborhood' | 'radius' | 'custom';

export interface DeliveryArea {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  area_type: AreaType;
  radius_km: number | null;
  center_lat: number | null;
  center_lng: number | null;
  delivery_fee: number;
  minimum_order_value: number | null;
  estimated_time_min: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryNeighborhood {
  id: string;
  delivery_area_id: string;
  neighborhood_name: string;
  city: string;
  state: string;
  custom_delivery_fee: number | null;
  custom_minimum_order: number | null;
  custom_estimated_time: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryEligibility {
  is_eligible: boolean;
  delivery_area_id: string | null;
  delivery_area_name: string | null;
  delivery_fee: number | null;
  minimum_order_value: number | null;
  estimated_time_min: number | null;
  message: string;
}

export interface DeliveryAreaSummary {
  total_areas: number;
  total_neighborhoods: number;
  active_areas: number;
  min_delivery_fee: number | null;
  max_delivery_fee: number | null;
  avg_estimated_time: number | null;
}

// ── Service ───────────────────────────────────────────────────────────────

export const DeliveryAreaService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // ÁREAS DE ENTREGA
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Lista áreas de entrega de uma empresa
   */
  async listAreas(businessId: string): Promise<ServiceResult<DeliveryArea[]>> {
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .eq('business_id', businessId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[DeliveryAreaService] listAreas error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryArea[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca uma área específica
   */
  async getArea(areaId: string): Promise<ServiceResult<DeliveryArea>> {
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .eq('id', areaId)
        .single();

      if (error) {
        logger.error('[DeliveryAreaService] getArea error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryArea, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria uma nova área de entrega
   */
  async createArea(input: {
    business_id: string;
    name: string;
    description?: string;
    area_type?: AreaType;
    radius_km?: number;
    center_lat?: number;
    center_lng?: number;
    delivery_fee: number;
    minimum_order_value?: number;
    estimated_time_min?: number;
    is_active?: boolean;
    display_order?: number;
  }): Promise<ServiceResult<DeliveryArea>> {
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .insert({
          business_id: input.business_id,
          name: input.name,
          description: input.description || null,
          area_type: input.area_type || 'neighborhood',
          radius_km: input.radius_km || null,
          center_lat: input.center_lat || null,
          center_lng: input.center_lng || null,
          delivery_fee: input.delivery_fee,
          minimum_order_value: input.minimum_order_value || null,
          estimated_time_min: input.estimated_time_min || 30,
          is_active: input.is_active ?? true,
          display_order: input.display_order ?? 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryAreaService] createArea error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryArea, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza uma área de entrega
   */
  async updateArea(
    areaId: string,
    input: Partial<Omit<DeliveryArea, 'id' | 'business_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResult<DeliveryArea>> {
    try {
      const { data, error } = await supabase
        .from('delivery_areas')
        .update(input)
        .eq('id', areaId)
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryAreaService] updateArea error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryArea, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta uma área de entrega
   */
  async deleteArea(areaId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('delivery_areas')
        .delete()
        .eq('id', areaId);

      if (error) {
        logger.error('[DeliveryAreaService] deleteArea error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Reordena áreas de entrega
   */
  async reorderAreas(
    businessId: string,
    areaIds: string[]
  ): Promise<ServiceResult<boolean>> {
    try {
      // Atualiza display_order de cada área
      const updates = areaIds.map((id, index) =>
        supabase
          .from('delivery_areas')
          .update({ display_order: index })
          .eq('id', id)
          .eq('business_id', businessId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        logger.error('[DeliveryAreaService] reorderAreas error');
        return { data: null, error: 'Erro ao reordenar áreas' };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BAIRROS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista bairros de uma área
   */
  async listNeighborhoods(areaId: string): Promise<ServiceResult<DeliveryNeighborhood[]>> {
    try {
      const { data, error } = await supabase
        .from('delivery_neighborhoods')
        .select('*')
        .eq('delivery_area_id', areaId)
        .order('neighborhood_name', { ascending: true });

      if (error) {
        logger.error('[DeliveryAreaService] listNeighborhoods error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryNeighborhood[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Adiciona um bairro a uma área
   */
  async addNeighborhood(input: {
    delivery_area_id: string;
    neighborhood_name: string;
    city: string;
    state: string;
    custom_delivery_fee?: number;
    custom_minimum_order?: number;
    custom_estimated_time?: number;
    is_active?: boolean;
  }): Promise<ServiceResult<DeliveryNeighborhood>> {
    try {
      const { data, error } = await supabase
        .from('delivery_neighborhoods')
        .insert({
          delivery_area_id: input.delivery_area_id,
          neighborhood_name: input.neighborhood_name,
          city: input.city,
          state: input.state,
          custom_delivery_fee: input.custom_delivery_fee || null,
          custom_minimum_order: input.custom_minimum_order || null,
          custom_estimated_time: input.custom_estimated_time || null,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryAreaService] addNeighborhood error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryNeighborhood, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza um bairro
   */
  async updateNeighborhood(
    neighborhoodId: string,
    input: Partial<Omit<DeliveryNeighborhood, 'id' | 'delivery_area_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResult<DeliveryNeighborhood>> {
    try {
      const { data, error } = await supabase
        .from('delivery_neighborhoods')
        .update(input)
        .eq('id', neighborhoodId)
        .select()
        .single();

      if (error) {
        logger.error('[DeliveryAreaService] updateNeighborhood error', error);
        return { data: null, error: error.message };
      }

      return { data: data as DeliveryNeighborhood, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Remove um bairro
   */
  async deleteNeighborhood(neighborhoodId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('delivery_neighborhoods')
        .delete()
        .eq('id', neighborhoodId);

      if (error) {
        logger.error('[DeliveryAreaService] deleteNeighborhood error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Adiciona múltiplos bairros de uma vez
   */
  async addNeighborhoodsBulk(
    areaId: string,
    neighborhoods: Array<{
      neighborhood_name: string;
      city: string;
      state: string;
    }>
  ): Promise<ServiceResult<boolean>> {
    try {
      const records = neighborhoods.map((n) => ({
        delivery_area_id: areaId,
        neighborhood_name: n.neighborhood_name,
        city: n.city,
        state: n.state,
      }));

      const { error } = await supabase
        .from('delivery_neighborhoods')
        .insert(records);

      if (error) {
        logger.error('[DeliveryAreaService] addNeighborhoodsBulk error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO E CÁLCULOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica elegibilidade de entrega
   */
  async checkEligibility(
    businessId: string,
    neighborhood: string,
    city: string,
    state: string,
    orderValue: number = 0
  ): Promise<ServiceResult<DeliveryEligibility>> {
    try {
      const { data, error } = await supabase.rpc('check_delivery_eligibility', {
        p_business_id: businessId,
        p_neighborhood: neighborhood,
        p_city: city,
        p_state: state,
        p_order_value: orderValue,
      });

      if (error) {
        logger.error('[DeliveryAreaService] checkEligibility error', error);
        return { data: null, error: error.message };
      }

      // RPC retorna array, pega primeiro resultado
      const result = Array.isArray(data) ? data[0] : data;

      return { data: result as DeliveryEligibility, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Retorna resumo das áreas de entrega
   */
  async getSummary(businessId: string): Promise<ServiceResult<DeliveryAreaSummary>> {
    try {
      const { data, error } = await supabase.rpc('get_delivery_areas_summary', {
        p_business_id: businessId,
      });

      if (error) {
        logger.error('[DeliveryAreaService] getSummary error', error);
        return { data: null, error: error.message };
      }

      // RPC retorna array, pega primeiro resultado
      const result = Array.isArray(data) ? data[0] : data;

      return { data: result as DeliveryAreaSummary, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};

