/**
 * AdminSubscriptionsService - SSOT para gestão administrativa de assinaturas
 */

import { logger } from "@/shared/utils/logger";

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  byPlan: Record<string, number>;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageLifetime: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "expired" | "cancelled" | "pending";
  active: boolean;
  amount_cents: number;
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

class AdminSubscriptionsServiceClass {
  /**
   * Busca estatísticas de assinaturas
   */
  async getStats(): Promise<SubscriptionStats> {
    try {
      const { data: subscriptions, error } = await supabase
        .from("user_subscriptions")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const stats: SubscriptionStats = {
        total: subscriptions?.length || 0,
        active: subscriptions?.filter(s => s.active && s.status === "active").length || 0,
        expired: subscriptions?.filter(s => s.status === "expired").length || 0,
        cancelled: subscriptions?.filter(s => s.status === "cancelled").length || 0,
        byPlan: {},
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        averageLifetime: 0,
      };

      subscriptions?.forEach(s => {
        if (s.plan_type) {
          stats.byPlan[s.plan_type] = (stats.byPlan[s.plan_type] || 0) + 1;
        }
        if (s.amount_cents) {
          stats.totalRevenue += s.amount_cents / 100;
          if (s.active && s.status === "active") {
            stats.monthlyRecurringRevenue += s.amount_cents / 100;
          }
        }
      });

      // Calcular tempo médio de vida das assinaturas
      const lifetimes = subscriptions
        ?.filter(s => s.started_at)
        .map(s => {
          const start = new Date(s.started_at);
          const end = s.cancelled_at ? new Date(s.cancelled_at) : now;
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // dias
        }) || [];

      stats.averageLifetime = lifetimes.length > 0
        ? lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length
        : 0;

      return stats;
    } catch (error) {
      logger.error("Error fetching subscription stats:", error);
      throw error;
    }
  }

  /**
   * Busca todas as assinaturas com paginação
   */
  async getAllSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    planType?: string;
    status?: string;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        planType,
        status,
      } = params;

      let query = supabase
        .from("user_subscriptions")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `, { count: "exact" });

      // Filtros
      if (search) {
        query = query.or(`user.email.ilike.%${search}%`);
      }
      if (planType) {
        query = query.eq("plan_type", planType);
      }
      if (status) {
        query = query.eq("status", status);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching subscriptions:", error);
      throw error;
    }
  }

  /**
   * Cria nova assinatura
   */
  async createSubscription(data: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from("user_subscriptions")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return subscription;
    } catch (error) {
      logger.error("Error creating subscription:", error);
      return null;
    }
  }

  /**
   * Atualiza assinatura
   */
  async updateSubscription(id: string, data: Partial<Subscription>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error updating subscription:", error);
      return false;
    }
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          active: false,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error cancelling subscription:", error);
      return false;
    }
  }

  /**
   * Reativa assinatura
   */
  async reactivateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          active: true,
          cancelled_at: null,
        })
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error reactivating subscription:", error);
      return false;
    }
  }

  /**
   * Busca assinaturas expirando
   */
  async getExpiringSubscriptions(daysAhead: number = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `)
        .eq("active", true)
        .eq("status", "active")
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching expiring subscriptions:", error);
      return [];
    }
  }

  /**
   * Busca receita por período
   */
  async getRevenueByPeriod(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("amount_cents, created_at, plan_type")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      const revenue = {
        total: 0,
        byPlan: {} as Record<string, number>,
        byMonth: {} as Record<string, number>,
      };

      data?.forEach(s => {
        const amount = s.amount_cents / 100;
        revenue.total += amount;

        if (s.plan_type) {
          revenue.byPlan[s.plan_type] = (revenue.byPlan[s.plan_type] || 0) + amount;
        }

        const month = new Date(s.created_at).toISOString().slice(0, 7);
        revenue.byMonth[month] = (revenue.byMonth[month] || 0) + amount;
      });

      return revenue;
    } catch (error) {
      logger.error("Error fetching revenue:", error);
      return { total: 0, byPlan: {}, byMonth: {} };
    }
  }

  /**
   * Busca churn rate (taxa de cancelamento)
   */
  async getChurnRate(months: number = 3) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: subscriptions, error } = await supabase
        .from("user_subscriptions")
        .select("status, cancelled_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const total = subscriptions?.length || 0;
      const cancelled = subscriptions?.filter(s => s.status === "cancelled").length || 0;

      return {
        churnRate: total > 0 ? (cancelled / total) * 100 : 0,
        totalSubscriptions: total,
        cancelledSubscriptions: cancelled,
      };
    } catch (error) {
      logger.error("Error calculating churn rate:", error);
      return { churnRate: 0, totalSubscriptions: 0, cancelledSubscriptions: 0 };
    }
  }

  /**
   * Upgrade de plano
   */
  async upgradePlan(subscriptionId: string, newPlan: string, newAmount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan_type: newPlan,
          amount_cents: newAmount,
        })
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error upgrading plan:", error);
      return false;
    }
  }

  /**
   * Downgrade de plano
   */
  async downgradePlan(subscriptionId: string, newPlan: string, newAmount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          plan_type: newPlan,
          amount_cents: newAmount,
        })
        .eq("id", subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error downgrading plan:", error);
      return false;
    }
  }
}

export const adminSubscriptionsService = new AdminSubscriptionsServiceClass();
