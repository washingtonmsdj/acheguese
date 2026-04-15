// @ts-nocheck
/**
 * Activity Query Service — operações de atividades sociais de gastronomia
 *
 * SSOT para feed de atividades dos vizinhos.
 * Agrega dados de reviews, favoritos e pedidos compartilhados.
 *
 * Regras de Privacidade:
 * - Reviews: Sempre públicas (automático)
 * - Favoritos: Sempre públicos (automático)
 * - Pedidos: Requerem opt-in (share_as_activity = true)
 * - Visitas: Requerem opt-in (futuro - check-ins)
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type { 
  GastronomyActivity, 
  GastronomyActivityFilters,
  ActivityType 
} from '../types/gastronomy';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formatar timestamp para "tempo atrás" em português
 */
function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (error) {
    logger.error('Error formatting time ago', error, { timestamp });
    return 'recentemente';
  }
}

/**
 * Converter padrão de geographic_path para regex PostgreSQL
 */
function buildGeographicPathPattern(
  territoryFilter?: import('@/core/location/types').TerritoryFilter
): string | null {
  if (!territoryFilter) {
    return null;
  }

  const { state, city, district } = territoryFilter;

  if (district) {
    // Padrão: BR.BA.Salvador.Nordeste
    return `^BR\\.${state}\\.${city}\\.${district}$`;
  } else if (city) {
    // Padrão: BR.BA.Salvador.*
    return `^BR\\.${state}\\.${city}\\.`;
  } else if (state) {
    // Padrão: BR.BA.*
    return `^BR\\.${state}\\.`;
  }

  return null;
}

export class ActivityQueryService {
  /**
   * Obter atividades recentes de gastronomia no território
   *
   * Agrega dados de:
   * - Reviews recentes (sempre públicas)
   * - Favoritos recentes (sempre públicos)
   * - Pedidos recentes (apenas se share_as_activity = true)
   *
   * @param filters - Filtros de território e tipos de atividade
   * @returns Array de atividades ordenadas por data (mais recente primeiro)
   */
  static async getRecentActivities(
    filters: GastronomyActivityFilters = {}
  ): Promise<GastronomyActivity[]> {
    try {
      const { territoryFilter, limit = 10, types } = filters;

      const geographicPathPattern = buildGeographicPathPattern(territoryFilter);

      const { data, error } = await supabase.rpc(
        'get_recent_gastronomy_activities',
        {
          p_geographic_path_pattern: geographicPathPattern,
          p_limit: limit,
          p_types: types || null,
        }
      );

      if (error) {
        logger.error('Failed to fetch recent activities', error, {
          filters,
          geographicPathPattern,
        });
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transformar dados e adicionar time_ago
      const activities: GastronomyActivity[] = data.map((row: any) => ({
        id: row.id,
        type: row.type as ActivityType,
        user_name: row.user_name,
        user_avatar: row.user_avatar,
        business_id: row.business_id,
        business_name: row.business_name,
        business_slug: row.business_slug,
        action_label: row.action_label,
        emoji: row.emoji,
        created_at: row.created_at,
        time_ago: formatTimeAgo(row.created_at),
      }));

      logger.info('Recent activities fetched successfully', {
        count: activities.length,
        filters,
      });

      return activities;
    } catch (error) {
      logger.error('Error in getRecentActivities', error);
      throw error;
    }
  }

  /**
   * Obter atividades de um usuário específico
   *
   * @param userId - ID do usuário
   * @param limit - Número máximo de atividades
   * @returns Array de atividades do usuário
   */
  static async getUserActivities(
    userId: string,
    limit = 20
  ): Promise<GastronomyActivity[]> {
    try {
      // TODO: Implementar query específica para atividades de um usuário
      // Por enquanto, retornar array vazio
      logger.warn('getUserActivities not implemented yet', { userId, limit });
      return [];
    } catch (error) {
      logger.error('Error in getUserActivities', error);
      throw error;
    }
  }

  /**
   * Obter atividades de um estabelecimento
   *
   * @param businessId - ID do estabelecimento
   * @param limit - Número máximo de atividades
   * @returns Array de atividades relacionadas ao estabelecimento
   */
  static async getBusinessActivities(
    businessId: string,
    limit = 20
  ): Promise<GastronomyActivity[]> {
    try {
      // TODO: Implementar query específica para atividades de um estabelecimento
      // Por enquanto, retornar array vazio
      logger.warn('getBusinessActivities not implemented yet', {
        businessId,
        limit,
      });
      return [];
    } catch (error) {
      logger.error('Error in getBusinessActivities', error);
      throw error;
    }
  }

  /**
   * Verificar se usuário tem configuração de compartilhamento ativa
   *
   * @param userId - ID do usuário
   * @returns true se usuário compartilha atividades por padrão
   */
  static async getUserShareActivityDefault(userId: string): Promise<boolean> {
    try {
      // eslint-disable-next-line ssot/no-direct-profile-access -- Campo específico de privacidade de atividades
      const { data, error } = await supabase
        .from('profiles')
        .select('share_activity_default')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Failed to get user share activity default', error, {
          userId,
        });
        return true; // Padrão: compartilhar
      }

      return data?.share_activity_default ?? true;
    } catch (error) {
      logger.error('Error in getUserShareActivityDefault', error);
      return true; // Padrão: compartilhar
    }
  }

  /**
   * Atualizar configuração de compartilhamento do usuário
   *
   * @param userId - ID do usuário
   * @param shareDefault - true para compartilhar por padrão
   */
  static async updateUserShareActivityDefault(
    userId: string,
    shareDefault: boolean
  ): Promise<void> {
    try {
      // eslint-disable-next-line ssot/no-direct-profile-access -- Campo específico de privacidade de atividades
      const { error } = await supabase
        .from('profiles')
        .update({ share_activity_default: shareDefault })
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to update user share activity default', error, {
          userId,
          shareDefault,
        });
        throw error;
      }

      logger.info('User share activity default updated', {
        userId,
        shareDefault,
      });
    } catch (error) {
      logger.error('Error in updateUserShareActivityDefault', error);
      throw error;
    }
  }
}
