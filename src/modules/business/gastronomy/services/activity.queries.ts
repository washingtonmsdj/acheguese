import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { profileService } from '@/core/profiles/services/ProfileService';
import type {
  GastronomyActivity,
  GastronomyActivityFilters,
  ActivityType,
} from '../types/gastronomy';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from '@/shared/utils/dateLocale';

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

function buildGeographicPathPattern(
  territoryFilter?: import('@/core/location/types').TerritoryFilter,
): string | null {
  if (!territoryFilter) {
    return null;
  }
  // TerritoryFilter canônico não carrega state/city/district diretamente.
  // Nesta query, filtro geográfico textual é opcional; quando não há
  // conversao segura, mantemos null para evitar inferencia incorreta.
  return null;
}

function mapActivityRows(rows: Array<Record<string, unknown>>): GastronomyActivity[] {
  return rows.map((row) => {
    const createdAt = String(row.created_at ?? new Date().toISOString());

    return {
      id: String(row.id),
      type: row.type as ActivityType,
      user_name: String(row.user_name ?? 'Usuario'),
      user_avatar: (row.user_avatar as string | null) ?? null,
      business_id: String(row.business_id ?? ''),
      business_name: String(row.business_name ?? ''),
      business_slug: String(row.business_slug ?? ''),
      action_label: String(row.action_label ?? ''),
      created_at: createdAt,
      time_ago: formatTimeAgo(createdAt),
    };
  });
}

export class ActivityQueryService {
  static async getRecentActivities(
    filters: GastronomyActivityFilters = {},
  ): Promise<GastronomyActivity[]> {
    try {
      const { territoryFilter, limit = 10, types } = filters;
      const geographicPathPattern = buildGeographicPathPattern(territoryFilter);

      const { data, error } = await supabase.rpc('get_recent_gastronomy_activities', {
        p_geographic_path_pattern: geographicPathPattern,
        p_limit: limit,
        p_types: types || null,
      });

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

      const activities = mapActivityRows((data as Array<Record<string, unknown>>) ?? []);

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

  static async getUserActivities(
    userId: string,
    limit = 20,
  ): Promise<GastronomyActivity[]> {
    try {
      const rawLimit = Math.max(limit * 5, 50);
      const { data, error } = await supabase.rpc('get_recent_gastronomy_activities', {
        p_geographic_path_pattern: null,
        p_limit: rawLimit,
        p_types: null,
      });

      if (error) {
        logger.error('Failed to fetch user activities', error, { userId, limit });
        throw error;
      }

      const rows = ((data as Array<Record<string, unknown>> | null) ?? []).filter((row) => {
        const actorUserId = row.user_id ?? row.actor_user_id ?? row.profile_user_id;
        const actorProfileId = row.profile_id ?? row.actor_profile_id;
        return actorUserId === userId || actorProfileId === userId;
      });

      return mapActivityRows(rows).slice(0, limit);
    } catch (error) {
      logger.error('Error in getUserActivities', error);
      throw error;
    }
  }

  static async getBusinessActivities(
    businessId: string,
    limit = 20,
  ): Promise<GastronomyActivity[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_gastronomy_activities', {
        p_geographic_path_pattern: null,
        p_limit: Math.max(limit, 20),
        p_types: null,
      });

      if (error) {
        logger.error('Failed to fetch business activities', error, {
          businessId,
          limit,
        });
        throw error;
      }

      const rows = ((data as Array<Record<string, unknown>> | null) ?? []).filter(
        (row) => row.business_id === businessId,
      );

      return mapActivityRows(rows).slice(0, limit);
    } catch (error) {
      logger.error('Error in getBusinessActivities', error);
      throw error;
    }
  }

  static async getUserShareActivityDefault(userId: string): Promise<boolean> {
    try {
      return profileService.getShareActivityDefault(userId);
    } catch (error) {
      logger.error('Error in getUserShareActivityDefault', error);
      return true;
    }
  }

  static async updateUserShareActivityDefault(
    userId: string,
    shareDefault: boolean,
  ): Promise<void> {
    try {
      await profileService.updateShareActivityDefault(userId, shareDefault);

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

