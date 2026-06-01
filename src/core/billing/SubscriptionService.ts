/**
 * CORE BILLING SUBSCRIPTION SERVICE
 *
 * SSOT: user_subscriptions.
 */
import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import { BusinessRepository, ProfileRepository } from "@/core/infrastructure/database";
import { PlanTier, type BusinessSubscription, type SubscriptionStatus } from "./types";
import { BILLING_SUBSCRIPTION_STATUS } from "./constants/subscription-status";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface CanonicalBusinessSubscriptionRow {
  id: string;
  user_id: string;
  business_id: string | null;
  plan_code: string | null;
  status_v2: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

const billingDb = supabase as any;
const businessRepository = new BusinessRepository();
const profileRepository = new ProfileRepository();

function toPlanTier(planCode: string | null | undefined): PlanTier {
  if (planCode === PlanTier.DELIVERY || planCode?.includes("delivery")) {
    return PlanTier.DELIVERY;
  }

  if (planCode === PlanTier.PRO || planCode?.includes("pro")) {
    return PlanTier.PRO;
  }

  return PlanTier.FREE;
}

function toSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  if (status === BILLING_SUBSCRIPTION_STATUS.CANCELED) return BILLING_SUBSCRIPTION_STATUS.CANCELED;
  if (status === BILLING_SUBSCRIPTION_STATUS.PAST_DUE) return BILLING_SUBSCRIPTION_STATUS.PAST_DUE;
  if (status === BILLING_SUBSCRIPTION_STATUS.TRIALING) return BILLING_SUBSCRIPTION_STATUS.TRIALING;
  return BILLING_SUBSCRIPTION_STATUS.ACTIVE;
}

function createDefaultFreeSubscription(businessId: string): BusinessSubscription {
  const now = new Date().toISOString();
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 100);

  return {
    id: `temp-free-${businessId}`,
    business_id: businessId,
    plan_tier: PlanTier.FREE,
    status: BILLING_SUBSCRIPTION_STATUS.ACTIVE,
    current_period_start: now,
    current_period_end: futureDate.toISOString(),
    cancel_at_period_end: false,
    trial_end: null,
    stripe_subscription_id: null,
    stripe_customer_id: null,
    created_at: now,
    updated_at: now,
  };
}

function mapCanonicalRow(row: CanonicalBusinessSubscriptionRow, businessId: string): BusinessSubscription {
  const now = new Date().toISOString();

  return {
    id: row.id,
    business_id: row.business_id ?? businessId,
    plan_tier: toPlanTier(row.plan_code),
    status: toSubscriptionStatus(row.status_v2),
    current_period_start: row.current_period_start ?? row.created_at ?? now,
    current_period_end: row.current_period_end ?? row.updated_at ?? now,
    cancel_at_period_end: row.cancel_at_period_end ?? false,
    trial_end: row.trial_ends_at,
    stripe_subscription_id: row.stripe_subscription_id,
    stripe_customer_id: row.stripe_customer_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toCanonicalStatus(status: SubscriptionStatus | undefined): string {
  if (!status) return "active";
  if (status === BILLING_SUBSCRIPTION_STATUS.CANCELED) return "canceled";
  return status;
}

async function resolveBusinessOwnerUserId(businessId: string): Promise<string | null> {
  try {
    const business = await businessRepository.findById(businessId);
    if (!business?.profile_id) {
      return null;
    }

    const profile = await profileRepository.findById(business.profile_id);
    return profile?.user_id ?? null;
  } catch (error) {
    logger.error("[SubscriptionService] Erro ao resolver dono da empresa:", error);
    return null;
  }
}

async function fetchCanonicalByBusinessId(
  businessId: string,
): Promise<CanonicalBusinessSubscriptionRow | null> {
  const { data, error } = await billingDb
    .from("user_subscriptions")
    .select(`
      id,
      user_id,
      business_id,
      plan_code,
      status_v2,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      trial_ends_at,
      stripe_subscription_id,
      stripe_customer_id,
      created_at,
      updated_at
    `)
    .eq("business_id", businessId)
    .eq("subscription_scope", "business")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CanonicalBusinessSubscriptionRow | null) ?? null;
}

export class SubscriptionService {
  static async getByBusinessId(
    businessId: string,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const row = await fetchCanonicalByBusinessId(businessId);
      return {
        data: row ? mapCanonicalRow(row, businessId) : createDefaultFreeSubscription(businessId),
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar assinatura";
      logger.error("[SubscriptionService] Erro ao buscar assinatura:", error);
      return { data: null, error: message };
    }
  }

  static async upsert(
    subscription: Partial<BusinessSubscription> & { business_id: string },
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const existing = await fetchCanonicalByBusinessId(subscription.business_id);
      const userId = existing?.user_id ?? (await resolveBusinessOwnerUserId(subscription.business_id));

      if (!userId) {
        return { data: null, error: "Dono da empresa nao encontrado para criar assinatura" };
      }

      const planTier = subscription.plan_tier ?? PlanTier.FREE;
      const status = toCanonicalStatus(subscription.status);
      const payload = {
        user_id: userId,
        business_id: subscription.business_id,
        plan_code: planTier,
        plan_type: planTier,
        status,
        status_v2: status,
        active: status === "active" || status === "trialing",
        subscription_scope: "business",
        entity_family: "company",
        current_period_start: subscription.current_period_start ?? new Date().toISOString(),
        current_period_end: subscription.current_period_end ?? null,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        trial_ends_at: subscription.trial_end ?? null,
        stripe_subscription_id: subscription.stripe_subscription_id ?? null,
        stripe_customer_id: subscription.stripe_customer_id ?? null,
        updated_at: new Date().toISOString(),
      };

      const query = existing
        ? billingDb.from("user_subscriptions").update(payload).eq("id", existing.id)
        : billingDb.from("user_subscriptions").insert(payload);

      const { data, error } = await query.select().single();
      if (error) throw error;

      return {
        data: mapCanonicalRow(data as CanonicalBusinessSubscriptionRow, subscription.business_id),
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar assinatura";
      logger.error("[SubscriptionService] Erro ao salvar assinatura:", error);
      return { data: null, error: message };
    }
  }

  static async updatePlan(
    businessId: string,
    newPlanTier: PlanTier,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await billingDb
        .from("user_subscriptions")
        .update({
          plan_code: newPlanTier,
          plan_type: newPlanTier,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", businessId)
        .eq("subscription_scope", "business")
        .select()
        .single();

      if (error) throw error;

      return { data: mapCanonicalRow(data as CanonicalBusinessSubscriptionRow, businessId), error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar plano";
      logger.error("[SubscriptionService] Erro ao atualizar plano:", error);
      return { data: null, error: message };
    }
  }

  static async cancel(
    businessId: string,
    immediately = false,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const updates: Record<string, unknown> = {
        cancel_at_period_end: !immediately,
        updated_at: new Date().toISOString(),
      };

      if (immediately) {
        updates.status = "canceled";
        updates.status_v2 = "canceled";
        updates.active = false;
        updates.plan_code = PlanTier.FREE;
        updates.plan_type = PlanTier.FREE;
        updates.current_period_end = new Date().toISOString();
      }

      const { data, error } = await billingDb
        .from("user_subscriptions")
        .update(updates)
        .eq("business_id", businessId)
        .eq("subscription_scope", "business")
        .select()
        .single();

      if (error) throw error;

      return { data: mapCanonicalRow(data as CanonicalBusinessSubscriptionRow, businessId), error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cancelar assinatura";
      logger.error("[SubscriptionService] Erro ao cancelar assinatura:", error);
      return { data: null, error: message };
    }
  }

  static async reactivate(
    businessId: string,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const { data, error } = await billingDb
        .from("user_subscriptions")
        .update({
          cancel_at_period_end: false,
          status: BILLING_SUBSCRIPTION_STATUS.ACTIVE,
          status_v2: BILLING_SUBSCRIPTION_STATUS.ACTIVE,
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", businessId)
        .eq("subscription_scope", "business")
        .select()
        .single();

      if (error) throw error;

      return { data: mapCanonicalRow(data as CanonicalBusinessSubscriptionRow, businessId), error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao reativar assinatura";
      logger.error("[SubscriptionService] Erro ao reativar assinatura:", error);
      return { data: null, error: message };
    }
  }
}
