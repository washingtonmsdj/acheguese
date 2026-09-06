import { supabase } from '@/integrations/supabase';
import {
  BillingPlanService,
  type PlanEntitlements,
} from '@/core/billing/services/BillingPlanService';
import { getBaselineEntitlements } from '@/core/billing/entitlementBaselines';
import { PlanTier } from '@/core/billing/types';
import { BillingEntitlementsRpcService } from '@/core/billing/services/BillingEntitlementsRpcService';
import { logger } from '@/shared/utils/logger';

type QueryError = { message?: string | null };

type QueryArrayResult<T> = {
  data: T[] | null;
  error: QueryError | null;
};

type QuerySingleResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type QueryBuilder<T extends object> = PromiseLike<QueryArrayResult<T>> & {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: readonly unknown[]): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(value: number): QueryBuilder<T>;
  maybeSingle(): Promise<QuerySingleResult<T>>;
};

type EntitlementDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

const entitlementDb = supabase as unknown as EntitlementDbClient;

export interface EntitlementContext {
  user_id: string;
  business_id?: string;
  subscription_scope?: 'user' | 'business' | 'profile' | 'worker';
}

export interface ResolvedEntitlements extends PlanEntitlements {
  planTier: string;
  planName: string;
  isActive: boolean;
}

type SnapshotPolicy = Partial<PlanEntitlements> & {
  can_use_premium_public_page?: boolean;
  can_use_short_premium_link?: boolean;
  can_use_custom_qr_code?: boolean;
  can_use_advanced_menu?: boolean;
  can_receive_internal_orders?: boolean;
  can_use_motoboy_network?: boolean;
  can_use_promotions?: boolean;
  can_use_basic_analytics?: boolean;
  can_use_advanced_analytics?: boolean;
  max_menu_items?: number | null;
  max_promotions?: number | null;
  max_images?: number | null;
  max_categories?: number | null;
  max_orders_per_day?: number | null;
  additional_entitlements?: Partial<PlanEntitlements> | null;
};

type ContractSnapshot = {
  catalog_item?: {
    entitlements?: Partial<PlanEntitlements> | null;
    catalog_entitlement_policy?: SnapshotPolicy | SnapshotPolicy[] | null;
  } | null;
  overrides?: Partial<ResolvedEntitlements> | null;
};

interface SubscriptionData {
  id: string;
  plan_code: string;
  status_v2: string;
  subscription_scope: string;
  contract_snapshot: ContractSnapshot | null;
}

function toPlanTier(value: string | null | undefined): PlanTier {
  const normalized = value?.replace(/^base-/, '');
  if (normalized === PlanTier.DELIVERY) return PlanTier.DELIVERY;
  if (normalized === PlanTier.PRO) return PlanTier.PRO;
  return PlanTier.FREE;
}

function withAliases(entitlements: PlanEntitlements): PlanEntitlements {
  return {
    ...entitlements,
    canUsePremiumSite: entitlements.canUsePremiumPublicPage,
    canUseShortLink: entitlements.canUseShortPremiumLink,
    canUseAdvancedCatalog: entitlements.canUseAdvancedMenu,
    canUseInternalOrders: entitlements.canReceiveInternalOrders,
    canUseDeliveryRequests: entitlements.canRequestDelivery,
    canUseDeliveryTracking: entitlements.canTrackDelivery,
    canUseDeliveryNetwork: entitlements.canUseMotoboyNetwork,
  };
}

function asSnapshotPolicy(
  value: SnapshotPolicy | SnapshotPolicy[] | null | undefined,
): SnapshotPolicy | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function snapshotEntitlements(
  snapshot: ContractSnapshot | null,
  tier: PlanTier,
): PlanEntitlements | null {
  const direct = snapshot?.catalog_item?.entitlements;
  if (direct) {
    return withAliases({ ...getBaselineEntitlements(tier), ...direct });
  }

  const policy = asSnapshotPolicy(snapshot?.catalog_item?.catalog_entitlement_policy);
  if (!policy) return null;

  const baseline = getBaselineEntitlements(tier);
  const extras = policy.additional_entitlements ?? {};
  return withAliases({
    ...baseline,
    ...extras,
    canUsePremiumPublicPage:
      policy.can_use_premium_public_page ?? baseline.canUsePremiumPublicPage,
    canUseShortPremiumLink:
      policy.can_use_short_premium_link ?? baseline.canUseShortPremiumLink,
    canUseCustomQRCode:
      policy.can_use_custom_qr_code ?? baseline.canUseCustomQRCode,
    canUseAdvancedMenu:
      policy.can_use_advanced_menu ?? baseline.canUseAdvancedMenu,
    canReceiveInternalOrders:
      policy.can_receive_internal_orders ?? baseline.canReceiveInternalOrders,
    canUseMotoboyNetwork:
      policy.can_use_motoboy_network ?? baseline.canUseMotoboyNetwork,
    canUsePromotions:
      policy.can_use_promotions ?? baseline.canUsePromotions,
    canUseBasicAnalytics:
      policy.can_use_basic_analytics ?? baseline.canUseBasicAnalytics,
    canUseAdvancedAnalytics:
      policy.can_use_advanced_analytics ?? baseline.canUseAdvancedAnalytics,
    maxMenuItems:
      policy.max_menu_items !== undefined ? policy.max_menu_items : baseline.maxMenuItems,
    maxPromotions:
      policy.max_promotions !== undefined ? policy.max_promotions : baseline.maxPromotions,
    maxImages:
      policy.max_images !== undefined ? policy.max_images : baseline.maxImages,
    maxCategories:
      policy.max_categories !== undefined ? policy.max_categories : baseline.maxCategories,
    maxOrdersPerDay:
      policy.max_orders_per_day !== undefined
        ? policy.max_orders_per_day
        : baseline.maxOrdersPerDay,
  });
}

function buildResolved(
  entitlements: PlanEntitlements,
  planTier: string,
  planName: string,
  isActive: boolean,
  overrides?: Partial<ResolvedEntitlements> | null,
): ResolvedEntitlements {
  return {
    ...withAliases(entitlements),
    ...(overrides ?? {}),
    planTier,
    planName,
    isActive,
  };
}

export class EntitlementResolver {
  static async resolve(context: EntitlementContext): Promise<ResolvedEntitlements> {
    try {
      const subscription = await this.getActiveSubscription(context);

      if (!subscription) {
        return this.resolveFree(false);
      }

      if (subscription.status_v2 !== 'active' && subscription.status_v2 !== 'trialing') {
        return this.resolveFree(false);
      }

      const tier = toPlanTier(subscription.plan_code);
      const plan = await BillingPlanService.getPlanByCode(subscription.plan_code);
      const entitlements =
        plan?.entitlements ??
        snapshotEntitlements(subscription.contract_snapshot, tier) ??
        getBaselineEntitlements(tier);

      return buildResolved(
        entitlements,
        plan?.code ?? subscription.plan_code,
        plan?.name ?? subscription.plan_code,
        true,
        subscription.contract_snapshot?.overrides,
      );
    } catch (error) {
      logger.error('[EntitlementResolver] Erro ao resolver entitlements:', error);
      return this.resolveFree(false);
    }
  }

  private static async resolveFree(isActive: boolean): Promise<ResolvedEntitlements> {
    try {
      const freePlan = await BillingPlanService.getPlanByCode(PlanTier.FREE);
      if (freePlan) {
        return buildResolved(
          freePlan.entitlements,
          freePlan.code,
          freePlan.name,
          isActive,
        );
      }
    } catch (error) {
      logger.warn('[EntitlementResolver] Catalogo Free indisponivel; usando baseline tecnico', error);
    }

    return buildResolved(
      getBaselineEntitlements(PlanTier.FREE),
      PlanTier.FREE,
      'Free',
      isActive,
    );
  }

  private static async getActiveSubscription(
    context: EntitlementContext,
  ): Promise<SubscriptionData | null> {
    try {
      if (context.subscription_scope === 'business') {
        if (!context.business_id) return null;

        const snapshot =
          await BillingEntitlementsRpcService.getBusinessSubscriptionSnapshot(
            context.business_id,
          );

        if (!snapshot) return null;

        return {
          id: `broker-business-${context.business_id}`,
          plan_code: snapshot.plan_code,
          status_v2: snapshot.status_v2,
          subscription_scope: snapshot.subscription_scope,
          contract_snapshot:
            snapshot.contract_snapshot as ContractSnapshot | null,
        };
      }

      const { data, error } = await entitlementDb
        .from<SubscriptionData>('user_subscriptions')
        .select(`
          id,
          plan_code,
          status_v2,
          subscription_scope,
          contract_snapshot
        `)
        .in('status_v2', ['active', 'trialing'])
        .eq('subscription_scope', 'user')
        .eq('user_id', context.user_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('[EntitlementResolver] Erro ao buscar assinatura:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('[EntitlementResolver] Erro ao buscar assinatura:', error);
      return null;
    }
  }

  static async check(
    context: EntitlementContext,
    entitlement: keyof ResolvedEntitlements,
  ): Promise<boolean> {
    const resolved = await this.resolve(context);
    const value = resolved[entitlement];

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (value === null) return true;
    return false;
  }

  static async hasShortPremiumLink(context: EntitlementContext): Promise<boolean> {
    return this.check(context, 'canUseShortPremiumLink');
  }
}

export const entitlementResolver = EntitlementResolver;
