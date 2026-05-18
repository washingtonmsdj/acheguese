/**
 * AdminService â€” SSOT canÃ´nico de administraÃ§Ã£o
 *
 * Centraliza toda a lÃ³gica de negÃ³cio de administraÃ§Ã£o.
 * Hooks e componentes NÃƒO acessam Supabase diretamente â€” consomem este service.
 *
 * Responsabilidades:
 * - GestÃ£o de empresas
 * - GestÃ£o de perfis
 * - GestÃ£o de planos
 * - Auditoria
 * - RelatÃ³rios
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { AdminSupabaseClient } from '../types/adminDatabase.types';
import { MobilityService } from '@/core/mobility/services/runtime';

const supabaseTyped = supabase as unknown as AdminSupabaseClient;
const db = supabase as any;

// â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  plan_tier: string;
  business_data?: { name?: string | null } | null;
};

// â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const AdminService = {
  
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // GESTÃƒO DE EMPRESAS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  
  /**
   * Lista todas as empresas com resumo
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
          name,
          slug,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: businesses, error } = await query;

      if (error) {
        logger.error('[AdminService] listBusinesses error', error);
        return { data: null, error: error.message };
      }

      // Busca plano e estatÃ­sticas de cada empresa
      const businessesWithStats = await Promise.all(
        (businesses || []).map(async (business) => {
          // Busca plano
          const { data: subscription } = await db
            .from('business_subscriptions')
            .select('plan_tier')
            .eq('business_id', business.id)
            .single();

          // Busca estatÃ­sticas de pedidos
          const { data: orderStats } = await db
            .from('orders')
            .select('total')
            .eq('business_id', business.id)
            .eq('status', 'completed');

          // Busca estatÃ­sticas de entregas
          const totalDeliveries = await MobilityService.countDeliveredBySource('business', business.id);

          const totalOrders = orderStats?.length || 0;
          const totalRevenue =
            (orderStats as Array<{ total?: number | null }> | null)?.reduce(
              (sum, o) => sum + (o.total || 0),
              0,
            ) || 0;

          return {
            ...business,
            plan_tier: subscription?.plan_tier || 'free',
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            total_deliveries: totalDeliveries,
          };
        })
      );

      return { data: businessesWithStats as BusinessSummary[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Ativa/desativa uma empresa
   */
  async toggleBusinessStatus(
    businessId: string,
    isActive: boolean
  ): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
        .from('business_data')
        .update({ is_active: isActive })
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // GESTÃƒO DE PERFIS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * Lista todos os perfis com resumo
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

      // Busca email e total de empresas de cada perfil
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
        })
      );

      return { data: profilesWithStats as ProfileSummary[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // GESTÃƒO DE PLANOS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * Lista uso de planos
   */
  async listPlanUsage(): Promise<ServiceResult<PlanUsage[]>> {
    try {
      const { data: subscriptions, error } = await db
        .from('business_subscriptions')
        .select(`
          business_id,
          plan_tier,
          business_data (
            name
          )
        `);

      if (error) {
        logger.error('[AdminService] listPlanUsage error', error);
        return { data: null, error: error.message };
      }

      // Busca estatÃ­sticas de cada empresa
      const usageData = await Promise.all(
        ((subscriptions as PlanUsageSubscriptionRow[] | null) || []).map(async (sub) => {
          // Busca pedidos
          const { data: orders } = await db
            .from('orders')
            .select('total')
            .eq('business_id', sub.business_id)
            .eq('status', 'completed');

          // Busca analytics
          const { data: analytics } = await db.rpc('get_analytics_metrics', {
            p_entity_type: 'business',
            p_entity_id: sub.business_id,
          });

          const totalOrders = orders?.length || 0;
          const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
          const metrics = analytics?.[0] || {};

          return {
            business_id: sub.business_id,
            business_name: sub.business_data?.name || '',
            plan_tier: sub.plan_tier,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            total_qr_scans: metrics.qr_scans || 0,
            total_views: metrics.total_views || 0,
          };
        })
      );

      return { data: usageData as PlanUsage[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza plano de uma empresa
   */
  async updateBusinessPlan(
    businessId: string,
    planTier: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
        .from('business_subscriptions')
        .update({ plan_tier: planTier })
        .eq('business_id', businessId);

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RELATÃ“RIOS E ESTATÃSTICAS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * Busca estatÃ­sticas gerais da plataforma
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
      // Total de empresas
      const { count: totalBusinesses } = await db
        .from('business_data')
        .select('*', { count: 'exact', head: true });

      // Empresas ativas
      const { count: activeBusinesses } = await db
        .from('business_data')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total de usuÃ¡rios
      const { count: totalUsers } = await db
        .from('profile_complete')
        .select('*', { count: 'exact', head: true });

      // Total de pedidos
      const { data: orders } = await db
        .from('orders')
        .select('total, status');

      const completedOrders =
        ((orders as Array<{ status?: string; total?: number | null }> | null) || []).filter(
          (o) => o.status === "completed",
        );
      const totalOrders = completedOrders.length;
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Total de entregas
      const totalDeliveries = await MobilityService.countDeliveredMotoboyRides();

      // DistribuiÃ§Ã£o de planos
      const { data: subscriptions } = await db
        .from('business_subscriptions')
        .select('plan_tier');

      const planDistribution = ((subscriptions as Array<{ plan_tier?: string }> | null) || []).reduce((acc, sub) => {
        const tier = sub.plan_tier || "free";
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
