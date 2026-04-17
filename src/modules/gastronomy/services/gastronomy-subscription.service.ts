import { supabase } from "@/integrations/supabase";
import type { PlanTier } from "@/core/billing";

export interface GastronomySubscription {
  id: string;
  business_id: string;
  plan_tier: PlanTier;
  status: "active" | "canceled" | "past_due" | "trialing";
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
  stripe_customer_id?: string;
}

export interface UpgradePlanParams {
  businessId: string;
  newPlanTier: PlanTier.PRO | PlanTier.DELIVERY;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}

export class GastronomySubscriptionService {
  static async getSubscriptionWithDetails(
    businessId: string,
  ): Promise<SubscriptionWithDetails> {
    const { data, error } = await supabase
      .from("gastronomy_subscriptions")
      .select(`
        *,
        business_data!inner(name)
      `)
      .eq("business_id", businessId)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      business_name: (data as { business_data?: { name?: string } })?.business_data?.name,
    } as SubscriptionWithDetails;
  }

  static async upgradePlan(params: UpgradePlanParams): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke("gastronomy-upgrade-plan", {
      body: {
        businessId: params.businessId,
        newPlanTier: params.newPlanTier,
        prorationBehavior: params.prorationBehavior,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async cancelSubscription(params: {
    businessId: string;
    immediately?: boolean;
  }): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke("gastronomy-cancel-subscription", {
      body: {
        businessId: params.businessId,
        immediately: params.immediately ?? false,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async reactivateSubscription(businessId: string): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke("gastronomy-reactivate-subscription", {
      body: { businessId },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async addPaymentMethod(params: {
    businessId: string;
    paymentMethodId: string;
  }): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke("gastronomy-add-payment-method", {
      body: {
        businessId: params.businessId,
        paymentMethodId: params.paymentMethodId,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }
}

