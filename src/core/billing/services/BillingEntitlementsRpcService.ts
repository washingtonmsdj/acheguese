import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type BillingEntitlementsRpcAction =
  | "getActiveSubscription"
  | "getBusinessSubscriptionSnapshot"
  | "hasPlan"
  | "hasFeature"
  | "getEntitlementLimit";

export interface BillingActiveSubscription {
  subscription_id: string;
  plan_code: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface ActiveSubscriptionBrokerData {
  subscription: BillingActiveSubscription | null;
}

export interface BusinessSubscriptionEntitlementSnapshot {
  plan_code: string;
  status_v2: string;
  subscription_scope: "business";
  contract_snapshot: Record<string, unknown> | null;
}

interface BusinessSubscriptionSnapshotBrokerData {
  subscription: BusinessSubscriptionEntitlementSnapshot | null;
}

interface HasPlanBrokerData {
  hasPlan: boolean;
}

interface HasFeatureBrokerData {
  hasFeature: boolean;
}

interface EntitlementLimitBrokerData {
  limit: number;
}

const FUNCTION_NAME = "billing-entitlements-rpc";
const SERVICE_NAME = "BillingEntitlementsRpcService";

export class BillingEntitlementsRpcService {
  private static async invoke<T>(
    action: BillingEntitlementsRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T | null> {
    return invokeNullableSupabaseBroker<T, BillingEntitlementsRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async getActiveSubscription(): Promise<BillingActiveSubscription | null> {
    const result = await this.invoke<ActiveSubscriptionBrokerData>("getActiveSubscription");
    return result?.subscription ?? null;
  }

  static async getBusinessSubscriptionSnapshot(
    businessDataId: string,
  ): Promise<BusinessSubscriptionEntitlementSnapshot | null> {
    const result = await this.invoke<BusinessSubscriptionSnapshotBrokerData>(
      "getBusinessSubscriptionSnapshot",
      { businessDataId },
    );
    return result?.subscription ?? null;
  }

  static async hasPlan(planCode: string): Promise<boolean> {
    const result = await this.invoke<HasPlanBrokerData>("hasPlan", { planCode });
    return result?.hasPlan === true;
  }

  static async hasFeature(feature: string): Promise<boolean> {
    const result = await this.invoke<HasFeatureBrokerData>("hasFeature", { feature });
    return result?.hasFeature === true;
  }

  static async getEntitlementLimit(entitlement: string): Promise<number> {
    const result = await this.invoke<EntitlementLimitBrokerData>("getEntitlementLimit", {
      entitlement,
    });
    return result?.limit ?? 0;
  }
}
