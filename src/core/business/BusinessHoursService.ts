/**
 * BusinessHoursService — SSOT canônico de horários de funcionamento
 *
 * Centraliza toda a lógica de negócio de horários.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - CRUD de horários padrão
 * - CRUD de exceções
 * - Configuração operacional
 * - Verificação de status (aberto/fechado)
 * - Cálculo de próximo horário
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
const businessHoursDb = supabase as any;

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0=domingo, 6=sábado
  opens_at: string; // HH:MM
  closes_at: string; // HH:MM
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHoursException {
  id: string;
  business_id: string;
  date: string; // YYYY-MM-DD
  opens_at: string | null; // HH:MM
  closes_at: string | null; // HH:MM
  is_closed: boolean;
  reason: string | null;
  created_at: string;
}

export interface BusinessOperationConfig {
  id: string;
  business_id: string;
  accepts_pickup: boolean;
  accepts_delivery: boolean;
  accepts_dine_in: boolean;
  uses_own_delivery: boolean;
  uses_platform_delivery: boolean;
  preparation_time_min: number;
  advance_order_hours: number | null;
  is_temporarily_closed: boolean;
  temporarily_closed_reason: string | null;
  temporarily_closed_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessStatus {
  isOpen: boolean;
  nextOpening: {
    date: string;
    opens_at: string;
    closes_at: string;
    is_exception: boolean;
    reason?: string;
  } | null;
}

export const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// ── Service ───────────────────────────────────────────────────────────────

export const BusinessHoursService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // HORÁRIOS PADRÃO
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Lista horários padrão de uma empresa
   */
  async listHours(businessId: string): Promise<ServiceResult<BusinessHours[]>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_hours')
        .select('*')
        .eq('business_id', businessId)
        .order('day_of_week', { ascending: true });

      if (error) {
        logger.error('[BusinessHoursService] listHours error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessHours[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Define ou atualiza horário de um dia específico
   */
  async setDayHours(input: {
    business_id: string;
    day_of_week: number;
    opens_at: string;
    closes_at: string;
    is_closed?: boolean;
  }): Promise<ServiceResult<BusinessHours>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_hours')
        .upsert({
          business_id: input.business_id,
          day_of_week: input.day_of_week,
          opens_at: input.opens_at,
          closes_at: input.closes_at,
          is_closed: input.is_closed ?? false,
        }, {
          onConflict: 'business_id,day_of_week',
        })
        .select()
        .single();

      if (error) {
        logger.error('[BusinessHoursService] setDayHours error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessHours, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Define horários em lote (todos os dias de uma vez)
   */
  async setBulkHours(
    businessId: string,
    hours: Array<{
      day_of_week: number;
      opens_at: string;
      closes_at: string;
      is_closed: boolean;
    }>
  ): Promise<ServiceResult<boolean>> {
    try {
      const records = hours.map((h) => ({
        business_id: businessId,
        ...h,
      }));

      const { error } = await businessHoursDb
        .from('business_hours')
        .upsert(records, {
          onConflict: 'business_id,day_of_week',
        });

      if (error) {
        logger.error('[BusinessHoursService] setBulkHours error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EXCEÇÕES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista exceções de horário
   */
  async listExceptions(businessId: string): Promise<ServiceResult<BusinessHoursException[]>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_hours_exceptions')
        .select('*')
        .eq('business_id', businessId)
        .order('date', { ascending: true });

      if (error) {
        logger.error('[BusinessHoursService] listExceptions error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessHoursException[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria ou atualiza uma exceção
   */
  async setException(input: {
    business_id: string;
    date: string;
    opens_at?: string;
    closes_at?: string;
    is_closed: boolean;
    reason?: string;
  }): Promise<ServiceResult<BusinessHoursException>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_hours_exceptions')
        .upsert({
          business_id: input.business_id,
          date: input.date,
          opens_at: input.opens_at || null,
          closes_at: input.closes_at || null,
          is_closed: input.is_closed,
          reason: input.reason || null,
        }, {
          onConflict: 'business_id,date',
        })
        .select()
        .single();

      if (error) {
        logger.error('[BusinessHoursService] setException error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessHoursException, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta uma exceção
   */
  async deleteException(exceptionId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await businessHoursDb
        .from('business_hours_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) {
        logger.error('[BusinessHoursService] deleteException error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO OPERACIONAL
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Busca configuração operacional
   */
  async getOperationConfig(businessId: string): Promise<ServiceResult<BusinessOperationConfig>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_operation_config')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) {
        logger.error('[BusinessHoursService] getOperationConfig error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessOperationConfig | null, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Retorna IDs de empresas temporariamente fechadas no momento.
   */
  async listTemporarilyClosedBusinessIds(
    businessIds: string[],
  ): Promise<ServiceResult<string[]>> {
    try {
      if (businessIds.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await businessHoursDb
        .from("business_operation_config")
        .select("business_id, is_temporarily_closed, temporarily_closed_until")
        .in("business_id", businessIds)
        .eq("is_temporarily_closed", true);

      if (error) {
        logger.error("[BusinessHoursService] listTemporarilyClosedBusinessIds error", error);
        return { data: null, error: error.message };
      }

      const now = Date.now();
      const ids = (data ?? [])
        .filter(
          (row) =>
            !row.temporarily_closed_until ||
            new Date(row.temporarily_closed_until).getTime() > now,
        )
        .map((row) => row.business_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      return { data: ids, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria ou atualiza configuração operacional
   */
  async setOperationConfig(input: {
    business_id: string;
    accepts_pickup?: boolean;
    accepts_delivery?: boolean;
    accepts_dine_in?: boolean;
    uses_own_delivery?: boolean;
    uses_platform_delivery?: boolean;
    preparation_time_min?: number;
    advance_order_hours?: number | null;
    is_temporarily_closed?: boolean;
    temporarily_closed_reason?: string | null;
    temporarily_closed_until?: string | null;
  }): Promise<ServiceResult<BusinessOperationConfig>> {
    try {
      const { data, error } = await businessHoursDb
        .from('business_operation_config')
        .upsert({
          business_id: input.business_id,
          accepts_pickup: input.accepts_pickup ?? true,
          accepts_delivery: input.accepts_delivery ?? false,
          accepts_dine_in: input.accepts_dine_in ?? true,
          uses_own_delivery: input.uses_own_delivery ?? false,
          uses_platform_delivery: input.uses_platform_delivery ?? false,
          preparation_time_min: input.preparation_time_min ?? 30,
          advance_order_hours: input.advance_order_hours ?? null,
          is_temporarily_closed: input.is_temporarily_closed ?? false,
          temporarily_closed_reason: input.temporarily_closed_reason ?? null,
          temporarily_closed_until: input.temporarily_closed_until ?? null,
        }, {
          onConflict: 'business_id',
        })
        .select()
        .single();

      if (error) {
        logger.error('[BusinessHoursService] setOperationConfig error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessOperationConfig, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STATUS E VERIFICAÇÕES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica se empresa está aberta agora
   */
  async isOpenNow(businessId: string): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await businessHoursDb.rpc('is_business_open_now', {
        p_business_id: businessId,
      });

      if (error) {
        logger.error('[BusinessHoursService] isOpenNow error', error);
        return { data: null, error: error.message };
      }

      return { data: data as boolean, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Retorna próximo horário de abertura
   */
  async getNextOpening(businessId: string): Promise<ServiceResult<BusinessStatus['nextOpening']>> {
    try {
      const { data, error } = await businessHoursDb.rpc('get_next_opening_time', {
        p_business_id: businessId,
      });

      if (error) {
        logger.error('[BusinessHoursService] getNextOpening error', error);
        return { data: null, error: error.message };
      }

      return { data: data as BusinessStatus['nextOpening'], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Retorna status completo (aberto + próximo horário)
   */
  async getStatus(businessId: string): Promise<ServiceResult<BusinessStatus>> {
    try {
      const [isOpenResult, nextOpeningResult] = await Promise.all([
        this.isOpenNow(businessId),
        this.getNextOpening(businessId),
      ]);

      if (isOpenResult.error) {
        return { data: null, error: isOpenResult.error };
      }

      if (nextOpeningResult.error) {
        return { data: null, error: nextOpeningResult.error };
      }

      return {
        data: {
          isOpen: isOpenResult.data ?? false,
          nextOpening: nextOpeningResult.data,
        },
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};
