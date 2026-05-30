import { supabase } from "@/core/infrastructure/supabase";
import { BillingService } from "@/core/billing/services/BillingService";
import type { PlanTier } from "@/core/billing";
import { PlanTier as BillingPlanTier } from "@/core/billing";
import { getPublicAppOrigin } from "@/shared/config/publicAppOrigin";
import { logger } from "@/shared/utils/logger";
import {
  GASTRONOMY_SUBSCRIPTION_STATUSES,
  type GastronomySubscriptionStatus,
} from "../constants/subscription-status";

export interface GastronomySubscription {
  id: string;
  business_id: string;
  plan_tier: PlanTier;
  status: GastronomySubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithDetails extends GastronomySubscription {
  business_name?: string;
}

export interface UpgradePlanParams {
  businessId: string;
  newPlanTier: BillingPlanTier.PRO | BillingPlanTier.DELIVERY;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}

export interface GastronomyInvoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created: number;
  due_date: number | null;
}

interface CanonicalSubscriptionRow {
  id: string;
  business_id: string | null;
  plan_code: string | null;
  status_v2: GastronomySubscriptionStatus | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  business_data?: { business_name?: string | null } | null;
}

interface BillingTransactionRow {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const ACTIVE_STATUSES: GastronomySubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "canceled",
];

function toPlanTier(planCode: string | null | undefined): PlanTier {
  if (planCode === BillingPlanTier.DELIVERY || planCode?.includes("delivery")) {
    return BillingPlanTier.DELIVERY;
  }

  if (planCode === BillingPlanTier.PRO || planCode?.includes("pro")) {
    return BillingPlanTier.PRO;
  }

  return BillingPlanTier.FREE;
}

function getReturnUrl(businessId: string, state: "success" | "cancel" | "portal"): string {
  const publicOrigin = getPublicAppOrigin();
  const currentUrl = typeof window !== "undefined" && window.location?.href
    ? new URL(window.location.href)
    : new URL("/", requirePublicOrigin(publicOrigin));

  currentUrl.searchParams.set("businessId", businessId);
  currentUrl.searchParams.set("billing", state);

  return currentUrl.toString();
}

function requirePublicOrigin(origin: string): string {
  if (!origin) {
    throw new Error("Public app origin is not configured. Define VITE_PUBLIC_SITE_URL.");
  }

  return origin;
}

function createDefaultSubscription(
  businessId: string,
  businessName?: string | null,
): SubscriptionWithDetails {
  const now = new Date().toISOString();
  const distantFuture = new Date();
  distantFuture.setFullYear(distantFuture.getFullYear() + 100);

  return {
    id: `free-${businessId}`,
    business_id: businessId,
    plan_tier: BillingPlanTier.FREE,
    status: GASTRONOMY_SUBSCRIPTION_STATUSES.ACTIVE,
    current_period_start: now,
    current_period_end: distantFuture.toISOString(),
    cancel_at_period_end: false,
    trial_end: null,
    stripe_subscription_id: null,
    stripe_customer_id: null,
    created_at: now,
    updated_at: now,
    business_name: businessName ?? undefined,
  };
}

function mapSubscriptionRow(row: CanonicalSubscriptionRow): SubscriptionWithDetails {
  const now = new Date().toISOString();
  const status = row.status_v2 && ACTIVE_STATUSES.includes(row.status_v2)
    ? row.status_v2
    : "canceled";

  return {
    id: row.id,
    business_id: row.business_id ?? "",
    plan_tier: toPlanTier(row.plan_code),
    status,
    current_period_start: row.current_period_start ?? row.created_at ?? now,
    current_period_end: row.current_period_end ?? row.updated_at ?? now,
    cancel_at_period_end: row.cancel_at_period_end ?? false,
    trial_end: row.trial_ends_at,
    stripe_subscription_id: row.stripe_subscription_id,
    stripe_customer_id: row.stripe_customer_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    business_name: row.business_data?.business_name ?? undefined,
  };
}

async function getBusinessName(businessId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("business_data")
    .select("business_name")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    logger.warn("[GastronomySubscriptionService] Unable to fetch business name", {
      businessId,
      error: error.message,
    });
    return undefined;
  }

  return data?.business_name ?? undefined;
}

export class GastronomySubscriptionService {
  static async getSubscriptionWithDetails(
    businessId: string,
  ): Promise<SubscriptionWithDetails> {
    const { data, error } = await supabase
      .from("user_subscriptions")
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
        updated_at,
        business_data!inner(business_name)
      `)
      .eq("business_id", businessId)
      .eq("subscription_scope", "business")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return createDefaultSubscription(businessId, await getBusinessName(businessId));
    }

    return mapSubscriptionRow(data as CanonicalSubscriptionRow);
  }

  static async upgradePlan(params: UpgradePlanParams): Promise<{ redirected: boolean }> {
    const currentSubscription = await this.getSubscriptionWithDetails(params.businessId);
    const returnUrl = getReturnUrl(params.businessId, "portal");

    if (currentSubscription.stripe_subscription_id) {
      await BillingService.redirectToPortal(returnUrl);
      return { redirected: true };
    }

    await BillingService.redirectToCheckout({
      planCode: params.newPlanTier,
      successUrl: getReturnUrl(params.businessId, "success"),
      cancelUrl: getReturnUrl(params.businessId, "cancel"),
      businessId: params.businessId,
      subscriptionScope: "business",
      entityFamily: "company",
      vertical: "gastronomy",
    });

    return { redirected: true };
  }

  static async cancelSubscription(params: {
    businessId: string;
    immediately?: boolean;
  }): Promise<{ redirected: boolean }> {
    await BillingService.redirectToPortal(getReturnUrl(params.businessId, "portal"));
    return { redirected: true };
  }

  static async reactivateSubscription(businessId: string): Promise<{ redirected: boolean }> {
    await BillingService.redirectToPortal(getReturnUrl(businessId, "portal"));
    return { redirected: true };
  }

  static async addPaymentMethod(params: {
    businessId: string;
    paymentMethodId: string;
  }): Promise<{ redirected: boolean }> {
    await BillingService.redirectToPortal(getReturnUrl(params.businessId, "portal"));
    return { redirected: true };
  }

  static async listInvoices(businessId: string): Promise<GastronomyInvoice[]> {
    const { data, error } = await supabase
      .from("billing_transactions")
      .select("id, amount_cents, currency, status, created_at, metadata")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.warn("[GastronomySubscriptionService] Unable to fetch invoices", {
        businessId,
        error: error.message,
      });
      return [];
    }

    return ((data ?? []) as BillingTransactionRow[]).map((transaction) => {
      const amount = transaction.amount_cents ?? 0;
      const metadata = transaction.metadata ?? {};

      return {
        id: transaction.id,
        amount_due: amount,
        amount_paid: transaction.status === "succeeded" ? amount : 0,
        currency: transaction.currency ?? "BRL",
        status: transaction.status,
        hosted_invoice_url:
          typeof metadata.hosted_invoice_url === "string" ? metadata.hosted_invoice_url : null,
        invoice_pdf: typeof metadata.invoice_pdf === "string" ? metadata.invoice_pdf : null,
        created: Math.floor(new Date(transaction.created_at).getTime() / 1000),
        due_date: typeof metadata.due_date === "number" ? metadata.due_date : null,
      };
    });
  }
}
