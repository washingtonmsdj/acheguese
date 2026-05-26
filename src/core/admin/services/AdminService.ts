/**
 * AdminService - SSOT canonico de administracao
 *
 * Centraliza toda a logica de negocio de administracao.
 * Hooks e componentes NAO acessam Supabase diretamente - consomem este service.
 *
 * Responsabilidades:
 * - Gestao de empresas
 * - Gestao de perfis
 * - Gestao de planos
 * - Auditoria
 * - Relatorios
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { AdminSupabaseClient } from '../types/adminDatabase.types';
import { MobilityService } from '@/core/mobility/services/runtime';

const supabaseTyped = supabase as unknown as AdminSupabaseClient;
const db = supabase as any;

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  plan_tier: string;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_revenue: number;
  total_deliveries: number;
}

export interface ProfileSummary {
  id: string;
  username: string;
  full_name: string;
  email: string;
  created_at: string;
  total_businesses: number;
}

export interface PlanUsage {
  business_id: string;
  business_name: string;
  plan_tier: string;
  total_orders: number;
  total_revenue: number;
  total_qr_scans: number;
  total_views: number;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  changes: Record<string, unknown>;
  created_at: string;
}

type ProfileListRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

type PlanUsageSubscriptionRow = {
  business_id: string;
  plan_code: string;
  business_data?: { business_name?: string | null } | null;
};

export const AdminService = {
  /**
   * Lista todas as empresas com resumo.
   */
  async listBusinesses(filters?: {
    plan_tier?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
  }): Promise<ServiceResult<BusinessSummary[]>> {
    try {
      let query = db
        .from('business_data')
        .select(`
          id,
          business_name,
          slug,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('status', filters.is_active ? 'active' : 'inactive');
      }

      if (filters?.search) {
        query = query.ilike('business_name', `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: businesses, error } = await query;

      if (error) {
        logger.error('[AdminService] listBusinesses error', error);
        return { data: null, error: error.message };
      }

      const businessesWithStats = await Promise.all(
        (businesses || []).map(async (business) => {
          const { data: subscription } = await db
            .from('user_subscriptions')
            .select('plan_code')
            .eq('business_id', business.id)
            .eq('subscription_scope', 'business')
            .in('status_v2', ['active', 'trialing'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: orderStats } = await db
            .from('orders')
            .select('total')
            .eq('business_id', business.id)
            .eq('status', 'completed');

          const totalDeliveries = await MobilityService.countDeliveredBySource('business', business.id);
          const totalOrders = orderStats?.length || 0;
          const totalRevenue =
            (orderStats as Array<{ total?: number | null }> | null)?.reduce(
              (sum, o) => sum + (o.total || 0),
              0,
            ) || 0;

          return {
            id: business.id,
            name: business.business_name,
            slug: business.slug,
            is_active: business.status === 'active',
            created_at: business.created_at,
            plan_tier: subscription?.plan_code || 'free',
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            total_deliveries: totalDeliveries,
          };
        }),
      );

      return { data: businessesWithStats as BusinessSummary[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Ativa/desativa uma empresa.
   */
  async toggleBusinessStatus(
    businessId: string,
    isActive: boolean,
  ): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
        .from('business_data')
        .update({ status: isActive ? 'active' : 'inactive' })
        .eq('id', businessId);

      if (error) {
        logger.error('[AdminService] toggleBusinessStatus error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Lista todos os perfis com resumo.
   */
  async listProfiles(filters?: {
    search?: string;
    limit?: number;
  }): Promise<ServiceResult<ProfileSummary[]>> {
    try {
      let query = db
        .from('profile_complete')
        .select(`
          id,
          username,
          full_name,
          email,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`username.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: profiles, error } = await query;

      if (error) {
        logger.error('[AdminService] listProfiles error', error);
        return { data: null, error: error.message };
      }

      const profilesWithStats = await Promise.all(
        ((profiles as ProfileListRow[] | null) || []).map(async (profile) => {
          const { data: businesses } = await db
            .from('profile_links')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('entity_type', 'business');

          return {
            ...profile,
            email: profile.email || '',
            total_businesses: businesses?.length || 0,
          };
        }),
      );

      return { data: profilesWithStats as ProfileSummary[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Lista uso de planos.
   */
  async listPlanUsage(): Promise<ServiceResult<PlanUsage[]>> {
    try {
      const { data: subscriptions, error } = await db
        .from('user_subscriptions')
        .select(`
          business_id,
          plan_code,
          business_data (
            business_name
          )
        `)
        .eq('subscription_scope', 'business');

      if (error) {
        logger.error('[AdminService] listPlanUsage error', error);
        return { data: null, error: error.message };
      }

      const usageData = await Promise.all(
        ((subscriptions as PlanUsageSubscriptionRow[] | null) || []).map(async (sub) => {
          const { data: orders } = await db
            .from('orders')
            .select('total')
            .eq('business_id', sub.business_id)
            .eq('status', 'completed');

          const { data: analytics } = await db.rpc('get_analytics_metrics', {
            p_entity_type: 'business',
            p_entity_id: sub.business_id,
          });

          const totalOrders = orders?.length || 0;
          const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
          const metrics = analytics?.[0] || {};

          return {
            business_id: sub.business_id,
            business_name: sub.business_data?.business_name || '',
            plan_tier: sub.plan_code,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            total_qr_scans: metrics.qr_scans || 0,
            total_views: metrics.total_views || 0,
          };
        }),
      );

      return { data: usageData as PlanUsage[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza plano de uma empresa.
   */
  async updateBusinessPlan(
    businessId: string,
    planTier: string,
  ): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
        .from('user_subscriptions')
        .update({
          plan_code: planTier,
          plan_type: planTier,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('subscription_scope', 'business');

      if (error) {
        logger.error('[AdminService] updateBusinessPlan error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca estatisticas gerais da plataforma.
   */
  async getPlatformStats(): Promise<ServiceResult<{
    total_businesses: number;
    active_businesses: number;
    total_users: number;
    total_orders: number;
    total_revenue: number;
    total_deliveries: number;
    plan_distribution: Record<string, number>;
  }>> {
    try {
      const { count: totalBusinesses } = await db
        .from('business_data')
        .select('*', { count: 'exact', head: true });

      const { count: activeBusinesses } = await db
        .from('business_data')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalUsers } = await db
        .from('profile_complete')
        .select('*', { count: 'exact', head: true });

      const { data: orders } = await db
        .from('orders')
        .select('total, status');

      const completedOrders =
        ((orders as Array<{ status?: string; total?: number | null }> | null) || []).filter(
          (o) => o.status === 'completed',
        );
      const totalOrders = completedOrders.length;
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const totalDeliveries = await MobilityService.countDeliveredMotoboyRides();

      const { data: subscriptions } = await db
        .from('user_subscriptions')
        .select('plan_code')
        .eq('subscription_scope', 'business')
        .in('status_v2', ['active', 'trialing']);

      const planDistribution = ((subscriptions as Array<{ plan_code?: string }> | null) || []).reduce((acc, sub) => {
        const tier = sub.plan_code || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        data: {
          total_businesses: totalBusinesses || 0,
          active_businesses: activeBusinesses || 0,
          total_users: totalUsers || 0,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_deliveries: totalDeliveries || 0,
          plan_distribution: planDistribution,
        },
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};
