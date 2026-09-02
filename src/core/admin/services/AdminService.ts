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
import { buildSafeILikePattern, buildSafeOrILikeFilter } from '@/shared/utils/sqlSanitization';
import type { Tables } from '@/integrations/supabase';
import { MobilityService } from '@/core/mobility/services/runtime';
import { BusinessService } from '@/core/business/services/BusinessService';
import { AnalyticsService } from '@/core/analytics/AnalyticsService';

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  ilike(column: string, value: string): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type AdminServiceDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminServiceDbClient;

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

type BusinessNameRow = {
  business_name?: string | null;
};

type PlanUsageSubscriptionRow = {
  business_id: string;
  plan_code: string;
  business_data?: BusinessNameRow | readonly BusinessNameRow[] | null;
};

type BusinessDataListRow = Pick<Tables<'business_data'>, 'id' | 'business_name' | 'slug' | 'status' | 'created_at'>;
type UserSubscriptionPlanRow = { plan_code: string | null };
type OrderTotalRow = { total: number | null; status?: string | null };
type ProfileLinkIdRow = { id: string };

function isBusinessNameRowArray(
  relation: PlanUsageSubscriptionRow['business_data'],
): relation is readonly BusinessNameRow[] {
  return Array.isArray(relation);
}

function isBusinessNameRow(
  relation: PlanUsageSubscriptionRow['business_data'],
): relation is BusinessNameRow {
  return Boolean(relation) && typeof relation === 'object' && !Array.isArray(relation);
}

function normalizeBusinessNameRelation(
  relation: PlanUsageSubscriptionRow['business_data'],
): BusinessNameRow | null {
  if (isBusinessNameRowArray(relation)) {
    return relation[0] ?? null;
  }

  if (isBusinessNameRow(relation)) {
    return relation;
  }

  return null;
}

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
        .from<BusinessDataListRow>('business_data')
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
        const searchPattern = buildSafeILikePattern(filters.search);
        if (searchPattern) {
          query = query.ilike('business_name', searchPattern);
        }
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
            .from<UserSubscriptionPlanRow>('user_subscriptions')
            .select('plan_code')
            .eq('business_id', business.id)
            .eq('subscription_scope', 'business')
            .in('status_v2', ['active', 'trialing'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: orderStats } = await db
            .from<OrderTotalRow>('orders')
            .select('total')
            .eq('business_id', business.id)
            .eq('status', 'completed');

          const totalDeliveries = await MobilityService.countDeliveredBySource('business', business.id);
          const totalOrders = orderStats?.length || 0;
          const totalRevenue = (orderStats ?? []).reduce((sum, order) => sum + (order.total || 0), 0);

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
      const business = await BusinessService.getBusinessById(businessId);
      if (!business) {
        return { data: null, error: 'Empresa nao encontrada' };
      }

      await BusinessService.updateBusiness(business.profile_id, {
        status: isActive ? 'active' : 'inactive',
      });

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[AdminService] toggleBusinessStatus error', err);
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
        .from<ProfileListRow>('profile_complete')
        .select(`
          id,
          username,
          full_name,
          email,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        const searchFilter = buildSafeOrILikeFilter(['username', 'full_name'], filters.search);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
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
        (profiles ?? []).map(async (profile) => {
          const { data: businesses } = await db
            .from<ProfileLinkIdRow>('profile_links')
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
        .from<PlanUsageSubscriptionRow>('user_subscriptions')
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
        (subscriptions ?? []).map(async (sub) => {
          const { data: orders } = await db
            .from<OrderTotalRow>('orders')
            .select('total')
            .eq('business_id', sub.business_id)
            .eq('status', 'completed');

          const analyticsResult = await AnalyticsService.getMetrics('business', sub.business_id);
          if (analyticsResult.error) {
            logger.warn('[AdminService] listPlanUsage analytics unavailable', {
              businessId: sub.business_id,
              error: analyticsResult.error,
            });
          }

          const totalOrders = orders?.length || 0;
          const totalRevenue = (orders ?? []).reduce((sum, order) => sum + (order.total || 0), 0);
          const metrics = analyticsResult.data;
          const business = normalizeBusinessNameRelation(sub.business_data);

          return {
            business_id: sub.business_id,
            business_name: business?.business_name || '',
            plan_tier: sub.plan_code,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            total_qr_scans: metrics?.qr_scans ?? 0,
            total_views: metrics?.total_views ?? 0,
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
        .from<BusinessDataListRow>('business_data')
        .select('*', { count: 'exact', head: true });

      const { count: activeBusinesses } = await db
        .from<BusinessDataListRow>('business_data')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalUsers } = await db
        .from<ProfileListRow>('profile_complete')
        .select('*', { count: 'exact', head: true });

      const { data: orders } = await db
        .from<OrderTotalRow>('orders')
        .select('total, status');

      const completedOrders = (orders ?? []).filter((order) => order.status === 'completed');
      const totalOrders = completedOrders.length;
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);

      const totalDeliveries = await MobilityService.countDeliveredMotoboyRides();

      const { data: subscriptions } = await db
        .from<UserSubscriptionPlanRow>('user_subscriptions')
        .select('plan_code')
        .eq('subscription_scope', 'business')
        .in('status_v2', ['active', 'trialing']);

      const planDistributionMap = new Map<string, number>();
      for (const sub of subscriptions ?? []) {
        const tier = sub.plan_code || 'free';
        planDistributionMap.set(tier, (planDistributionMap.get(tier) ?? 0) + 1);
      }
      const planDistribution = Object.fromEntries(planDistributionMap);

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