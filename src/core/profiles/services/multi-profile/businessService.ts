/**
 * BUSINESS SERVICE - FASE 3
 * Service layer para operações de perfis business
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { BusinessData, ServiceResponse } from './types';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface BusinessDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const businessDb = supabase as unknown as BusinessDbClient;

export class BusinessService {
  /**
   * Buscar business data (via RLS)
   */
  static async getBusinessData(profileId: string): Promise<BusinessData | null> {
    try {
      const { data, error } = await businessDb
        .from<BusinessData>('business_data')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;

      return data as BusinessData;
    } catch (error: unknown) {
      logger.error('Error fetching business data:', error);
      return null;
    }
  }

  /**
   * Atualizar business data (via RLS)
   */
  static async updateBusinessData(
    profileId: string,
    updates: Partial<Omit<BusinessData, 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<BusinessData>> {
    try {
      const { data, error } = await businessDb
        .from<BusinessData>('business_data')
        .update(updates)
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as BusinessData,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to update business data'),
      };
    }
  }
}

