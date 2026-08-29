/**
 * CORE BILLING BUSINESS SUBSCRIPTION READER
 *
 * SSOT de persistencia: public.user_subscriptions.
 * Leitura de assinatura de Business fica aqui. Mudancas comerciais nao escrevem
 * a tabela pelo browser: upgrade passa pelo Stripe Checkout e downgrade/gestao
 * passa pelo Stripe Customer Portal; o webhook server-side materializa o estado.
 */
import { logger } from "@/shared/utils/logger";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { supabase } from "@/integrations/supabase";
import { BillingService } from "./services/BillingService";
import { PlanTier, type BusinessSubscription, type SubscriptionStatus } from "./types";
import { BILLING_SUBSCRIPTION_STATUS } from "./constants/subscription-status";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface CanonicalBusinessSubscriptionRow {
  id: string;
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

type QueryError = { message?: string | null };

type QuerySingleResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type QueryBuilder<T extends object> = {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(value: number): QueryBuilder<T>;
  maybeSingle(): Promise<QuerySingleResult<T>>;
};

type BillingDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

const billingDb = supabase as unknown as BillingDbClient;

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
  if (status === BILLING_SUBSCRIPTION_STATUS.ACTIVE) return BILLING_SUBSCRIPTION_STATUS.ACTIVE;
  if (status === BILLING_SUBSCRIPTION_STATUS.TRIALING) return BILLING_SUBSCRIPTION_STATUS.TRIALING;
  if (status === BILLING_SUBSCRIPTION_STATUS.PAST_DUE) return BILLING_SUBSCRIPTION_STATUS.PAST_DUE;
  return BILLING_SUBSCRIPTION_STATUS.CANCELED;
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

function mapCanonicalRow(
  row: CanonicalBusinessSubscriptionRow,
  businessId: string,
): BusinessSubscription {
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

async function fetchCanonicalByBusinessId(
  businessId: string,
): Promise<CanonicalBusinessSubscriptionRow | null> {
  const { data, error } = await billingDb
    .from<CanonicalBusinessSubscriptionRow>("user_subscriptions")
    .select(`
      id,
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
  return data ?? null;
}

export class BusinessSubscriptionService {
  static async getByBusinessId(
    businessId: string,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      const row = await fetchCanonicalByBusinessId(businessId);
      return {
        data: row
          ? mapCanonicalRow(row, businessId)
          : createDefaultFreeSubscription(businessId),
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao buscar assinatura";
      logger.error("[BusinessSubscriptionService] Erro ao buscar assinatura:", error);
      return { data: null, error: message };
    }
  }

  /**
   * Compatibilidade temporaria para callers de mudanca de plano.
   * Nao altera user_subscriptions. Paid tiers abrem Stripe Checkout e o plano
   * Free usa o Customer Portal para downgrade/cancelamento do contrato atual.
   */
  static async updatePlan(
    businessId: string,
    newPlanTier: PlanTier,
  ): Promise<ServiceResult<BusinessSubscription>> {
    try {
      if (newPlanTier === PlanTier.FREE) {
        await BillingService.redirectToPortal(buildPublicAbsoluteUrl("/planos"));
      } else {
        await BillingService.redirectToCheckout({
          planCode: newPlanTier,
          businessId,
          subscriptionScope: "business",
          entityFamily: "company",
          successUrl: buildPublicAbsoluteUrl("/checkout/success"),
          cancelUrl: buildPublicAbsoluteUrl("/planos"),
        });
      }

      return { data: null, error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar alteracao de plano";
      logger.error("[BusinessSubscriptionService] Erro ao iniciar alteracao de plano:", error);
      return { data: null, error: message };
    }
  }
}
