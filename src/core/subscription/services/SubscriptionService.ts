/**
 * SubscriptionService - SSOT para assinaturas e planos
 *
 * Responsável por gerenciar:
 * - Assinaturas de usuários
 * - Planos (free, basic, premium, enterprise)
 * - Status de pagamento
 * - Features por plano
 *
 * Arquitetura: Component → Hook → SubscriptionService → Supabase
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { USER_SUBSCRIPTION_STATUS } from "@/core/subscription/constants/subscriptionStatus";

export type PlanType = "free" | "basic" | "premium" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "suspended";

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  active: boolean;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  payment_method: string | null;
  last_payment_at: string | null;
  next_payment_at: string | null;
  amount_cents: number | null;
  currency: string;
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionParams {
  user_id: string;
  plan_type: PlanType;
  expires_at?: string | null;
  payment_method?: string;
  amount_cents?: number;
  features?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubscriptionParams {
  plan_type?: PlanType;
  status?: SubscriptionStatus;
  expires_at?: string | null;
  payment_method?: string;
  amount_cents?: number;
  features?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Features padrão por plano
 */
const PLAN_FEATURES: Record<PlanType, Record<string, unknown>> = {
  free: {
    max_businesses: 1,
    max_posts: 10,
    max_photos: 5,
    analytics: false,
    priority_support: false,
    verified_badge: false,
    ads_free: false,
  },
  basic: {
    max_businesses: 3,
    max_posts: 50,
    max_photos: 20,
    analytics: true,
    priority_support: false,
    verified_badge: false,
    ads_free: false,
  },
  premium: {
    max_businesses: 10,
    max_posts: -1, // ilimitado
    max_photos: 100,
    analytics: true,
    priority_support: true,
    verified_badge: true,
    ads_free: true,
  },
  enterprise: {
    max_businesses: -1, // ilimitado
    max_posts: -1,
    max_photos: -1,
    analytics: true,
    priority_support: true,
    verified_badge: true,
    ads_free: true,
    custom_domain: true,
    api_access: true,
  },
};

function getPlanFeatureSet(planType: PlanType): Record<string, unknown> {
  switch (planType) {
    case "free":
      return PLAN_FEATURES.free;
    case "basic":
      return PLAN_FEATURES.basic;
    case "premium":
      return PLAN_FEATURES.premium;
    case "enterprise":
      return PLAN_FEATURES.enterprise;
    default:
      return PLAN_FEATURES.free;
  }
}

function getFeatureValue(features: Record<string, unknown>, featureName: string): unknown {
  for (const [key, value] of Object.entries(features)) {
    if (key === featureName) {
      return value;
    }
  }
  return undefined;
}

function featureToBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

interface SubscriptionStatsRow {
  plan_type: PlanType;
  status: SubscriptionStatus;
  active: boolean;
  amount_cents: number | null;
}

/**
 * Serviço de Assinaturas - SSOT
 */
export class SubscriptionService {
  /**
   * Busca assinatura ativa de um usuário
   */
  static async getActiveSubscription(
    userId: string,
  ): Promise<Subscription | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "getActiveSubscription",
        metadata: { userId },
      });
      return null;
    }
  }

  /**
   * Busca histórico de assinaturas de um usuário
   */
  static async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "getSubscriptionHistory",
        metadata: { userId },
      });
      return [];
    }
  }

  /**
   * Cria uma nova assinatura
   */
  static async createSubscription(params: CreateSubscriptionParams): Promise<{
    success: boolean;
    subscription?: Subscription;
    error?: string;
  }> {
    try {
      // Desativar assinaturas antigas
      await (supabase as any)
        .from("user_subscriptions")
        .update({ active: false })
        .eq("user_id", params.user_id)
        .eq("active", true);

      // Criar nova assinatura
      const features = params.features || PLAN_FEATURES[params.plan_type];

      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .insert({
          user_id: params.user_id,
          plan_type: params.plan_type,
          status: USER_SUBSCRIPTION_STATUS.ACTIVE,
          active: true,
          expires_at: params.expires_at || null,
          payment_method: params.payment_method || null,
          amount_cents: params.amount_cents || null,
          features,
          metadata: params.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Subscription created", {
        userId: params.user_id,
        plan: params.plan_type,
      });

      return { success: true, subscription: data };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SubscriptionService",
        action: "createSubscription",
        metadata: { ...params },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Atualiza uma assinatura
   */
  static async updateSubscription(
    userId: string,
    updates: UpdateSubscriptionParams,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("user_subscriptions")
        .update(updates)
        .eq("user_id", userId)
        .eq("active", true);

      if (error) throw error;

      logger.info("Subscription updated", { userId, updates });
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SubscriptionService",
        action: "updateSubscription",
        metadata: { userId, updates },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancela uma assinatura
   */
  static async cancelSubscription(
    userId: string,
    immediate: boolean = false,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: {
        status: SubscriptionStatus;
        cancelled_at: string;
        active?: boolean;
        expires_at?: string;
      } = {
        status: USER_SUBSCRIPTION_STATUS.CANCELLED,
        cancelled_at: new Date().toISOString(),
      };

      if (immediate) {
        updates.active = false;
        updates.expires_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from("user_subscriptions")
        .update(updates)
        .eq("user_id", userId)
        .eq("active", true);

      if (error) throw error;

      logger.info("Subscription cancelled", { userId, immediate });
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SubscriptionService",
        action: "cancelSubscription",
        metadata: { userId, immediate },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Renova uma assinatura
   */
  static async renewSubscription(
    userId: string,
    expiresAt: string,
    amountCents?: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from("user_subscriptions")
        .update({
          status: USER_SUBSCRIPTION_STATUS.ACTIVE,
          expires_at: expiresAt,
          last_payment_at: new Date().toISOString(),
          next_payment_at: expiresAt,
          amount_cents: amountCents,
        })
        .eq("user_id", userId)
        .eq("active", true);

      if (error) throw error;

      logger.info("Subscription renewed", { userId, expiresAt });
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SubscriptionService",
        action: "renewSubscription",
        metadata: { userId, expiresAt },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verifica se usuário tem acesso a uma feature
   */
  static async hasFeature(
    userId: string,
    featureName: string,
  ): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(userId);

      if (!subscription) {
        // Sem assinatura = plano free
        return featureToBoolean(getFeatureValue(PLAN_FEATURES.free, featureName));
      }

      return featureToBoolean(getFeatureValue(subscription.features, featureName));
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "hasFeature",
        metadata: { userId, featureName },
      });
      return false;
    }
  }

  /**
   * Busca features do plano do usuário
   */
  static async getUserFeatures(userId: string): Promise<Record<string, unknown>> {
    try {
      const subscription = await this.getActiveSubscription(userId);

      if (!subscription) {
        return PLAN_FEATURES.free;
      }

      return subscription.features;
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "getUserFeatures",
        metadata: { userId },
      });
      return PLAN_FEATURES.free;
    }
  }

  /**
   * Busca estatísticas de assinaturas (admin)
   */
  static async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    by_plan: Record<PlanType, number>;
    by_status: Record<SubscriptionStatus, number>;
    revenue_monthly: number;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .select("plan_type, status, active, amount_cents");

      if (error) throw error;

      const rows = (data || []) as SubscriptionStatsRow[];
      const stats = {
        total: rows.length,
        active: rows.filter((s) => s.active).length,
        by_plan: {} as Record<PlanType, number>,
        by_status: {} as Record<SubscriptionStatus, number>,
        revenue_monthly: 0,
      };

      rows.forEach((s) => {
        // Contar por plano
        stats.by_plan[s.plan_type as PlanType] =
          (stats.by_plan[s.plan_type as PlanType] || 0) + 1;

        // Contar por status
        stats.by_status[s.status as SubscriptionStatus] =
          (stats.by_status[s.status as SubscriptionStatus] || 0) + 1;

        // Calcular receita (apenas assinaturas ativas)
        if (s.active && s.amount_cents) {
          stats.revenue_monthly += s.amount_cents;
        }
      });

      return stats;
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "getSubscriptionStats",
      });
      return {
        total: 0,
        active: 0,
        by_plan: {} as Record<PlanType, number>,
        by_status: {} as Record<SubscriptionStatus, number>,
        revenue_monthly: 0,
      };
    }
  }

  /**
   * Expira assinaturas vencidas (manutenção)
   */
  static async expireSubscriptions(): Promise<{
    success: boolean;
    expired: number;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .update({
          status: USER_SUBSCRIPTION_STATUS.EXPIRED,
          active: false,
        })
        .eq("active", true)
        .not("expires_at", "is", null)
        .lt("expires_at", new Date().toISOString())
        .select();

      if (error) throw error;

      const expired = data?.length || 0;
      logger.info("Subscriptions expired", { expired });

      return { success: true, expired };
    } catch (error) {
      trackError(error as Error, {
        component: "SubscriptionService",
        action: "expireSubscriptions",
      });
      return { success: false, expired: 0 };
    }
  }

  /**
   * Busca features padrão de um plano
   */
  static getPlanFeatures(planType: PlanType): Record<string, unknown> {
    return getPlanFeatureSet(planType);
  }
}

// Export singleton
export const subscriptionService = SubscriptionService;

