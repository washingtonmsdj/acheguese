import { supabase } from '@/integrations/supabase';
import {
  BillingPlanService,
  type PlanEntitlements,
} from '@/core/billing/services/BillingPlanService';
import { logger } from '@/shared/utils/logger';
import type { GenericBillingEntitlementAliases } from '../types';

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
  maybeSingle(): Promise<QuerySingleResult<T>>;
};

type EntitlementDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

type LooseEntitlementPolicy = Partial<PlanEntitlements> & Record<string, unknown>;

type ContractSnapshot = {
  catalog_item?: {
    entitlements?: LooseEntitlementPolicy | null;
  } | null;
  overrides?: Partial<ResolvedEntitlements> | null;
};

const entitlementDb = supabase as unknown as EntitlementDbClient;

export interface EntitlementContext {
  user_id: string;
  business_id?: string;
  subscription_scope?: 'user' | 'business' | 'profile' | 'worker';
}

export interface ResolvedEntitlements extends GenericBillingEntitlementAliases {
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
  canUseCustomQRCode: boolean;
  canUseAdvancedMenu: boolean;
  canUseMenuCategories: boolean;
  canUseMenuImages: boolean;
  canUseMenuVariations: boolean;
  canUseMenuAddons: boolean;
  canUseMenuCombos: boolean;
  canManageAvailability: boolean;
  canScheduleItems: boolean;
  canReceiveInternalOrders: boolean;
  canUseOrdersPanel: boolean;
  canManageOrderStatus: boolean;
  canCancelOrders: boolean;
  canViewOrderHistory: boolean;
  canUseMotoboyNetwork: boolean;
  canRequestDelivery: boolean;
  canTrackDelivery: boolean;
  canConfigureDeliveryArea: boolean;
  canSetDeliveryFees: boolean;
  canManageBusinessHours: boolean;
  canSetMinimumOrder: boolean;
  canUseOwnDelivery: boolean;
  canUsePromotions: boolean;
  canUseFeaturedPlacement: boolean;
  canUseBanners: boolean;
  canUseCoupons: boolean;
  canSchedulePromotions: boolean;
  canUseBasicAnalytics: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportReports: boolean;
  canViewRealtimeMetrics: boolean;
  canViewCustomerInsights: boolean;
  maxMenuItems: number | null;
  maxPromotions: number | null;
  maxImages: number | null;
  maxCategories: number | null;
  maxCombos: number | null;
  maxOrdersPerDay: number | null;
  planTier: string;
  planName: string;
  isActive: boolean;
}

interface SubscriptionData {
  id: string;
  plan_code: string;
  status_v2: string;
  subscription_scope: string;
  contract_snapshot: ContractSnapshot | null;
}

const DEFAULT_FREE_ENTITLEMENTS: ResolvedEntitlements = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  canUsePremiumSite: false,
  canUseShortLink: false,
  canUseAdvancedMenu: false,
  canUseAdvancedCatalog: false,
  canUseMenuCategories: true,
  canUseMenuImages: true,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: true,
  canScheduleItems: false,
  canReceiveInternalOrders: false,
  canUseInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  canUseMotoboyNetwork: false,
  canUseDeliveryNetwork: false,
  canRequestDelivery: false,
  canUseDeliveryRequests: false,
  canTrackDelivery: false,
  canUseDeliveryTracking: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: true,
  canSetMinimumOrder: false,
  canUseOwnDelivery: false,
  canUsePromotions: false,
  canUseFeaturedPlacement: false,
  canUseBanners: false,
  canUseCoupons: false,
  canSchedulePromotions: false,
  canUseBasicAnalytics: false,
  canUseAdvancedAnalytics: false,
  canExportReports: false,
  canViewRealtimeMetrics: false,
  canViewCustomerInsights: false,
  maxMenuItems: 20,
  maxPromotions: 0,
  maxImages: 5,
  maxCategories: 3,
  maxCombos: 0,
  maxOrdersPerDay: null,
  planTier: 'free',
  planName: 'Free',
  isActive: false,
};

function readBooleanPolicy(
  policy: LooseEntitlementPolicy,
  camelKey: string,
  snakeKey?: string,
): boolean {
  const camelValue = policy[camelKey];
  if (typeof camelValue === 'boolean') {
    return camelValue;
  }

  if (snakeKey) {
    const snakeValue = policy[snakeKey];
    if (typeof snakeValue === 'boolean') {
      return snakeValue;
    }
  }

  return false;
}

function readNullableNumberPolicy(
  policy: LooseEntitlementPolicy,
  camelKey: string,
  snakeKey?: string,
): number | null {
  const camelValue = policy[camelKey];
  if (typeof camelValue === 'number') {
    return camelValue;
  }
  if (camelValue === null) {
    return null;
  }

  if (snakeKey) {
    const snakeValue = policy[snakeKey];
    if (typeof snakeValue === 'number') {
      return snakeValue;
    }
    if (snakeValue === null) {
      return null;
    }
  }

  return null;
}

export class EntitlementResolver {
  static async resolve(context: EntitlementContext): Promise<ResolvedEntitlements> {
    try {
      const subscription = await this.getActiveSubscription(context);

      if (!subscription) {
        logger.info('[EntitlementResolver] Sem assinatura ativa, usando fallback free');
        return DEFAULT_FREE_ENTITLEMENTS;
      }

      if (subscription.status_v2 !== 'active' && subscription.status_v2 !== 'trialing') {
        logger.warn(
          `[EntitlementResolver] Assinatura ${subscription.id} nao esta ativa (${subscription.status_v2})`,
        );
        return { ...DEFAULT_FREE_ENTITLEMENTS, isActive: false };
      }

      return this.resolveFromSubscription(subscription);
    } catch (error) {
      logger.error('[EntitlementResolver] Erro ao resolver entitlements:', error);
      return DEFAULT_FREE_ENTITLEMENTS;
    }
  }

  private static async getActiveSubscription(
    context: EntitlementContext,
  ): Promise<SubscriptionData | null> {
    try {
      let query = entitlementDb
        .from<SubscriptionData>('user_subscriptions')
        .select(`
          id,
          plan_code,
          status_v2,
          subscription_scope,
          contract_snapshot
        `)
        .in('status_v2', ['active', 'trialing']);

      if (context.subscription_scope === 'business' && context.business_id) {
        query = query
          .eq('subscription_scope', 'business')
          .eq('business_id', context.business_id);
      } else {
        query = query.eq('subscription_scope', 'user').eq('user_id', context.user_id);
      }

      const { data, error } = await query.maybeSingle();

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

  private static async resolveFromSubscription(
    subscription: SubscriptionData,
  ): Promise<ResolvedEntitlements> {
    const resolved = { ...DEFAULT_FREE_ENTITLEMENTS };

    const plan = await BillingPlanService.getPlanByCode(subscription.plan_code);
    const snapshot = subscription.contract_snapshot;
    const snapshotEntitlements = snapshot?.catalog_item?.entitlements ?? undefined;
    const policy: LooseEntitlementPolicy | undefined = plan?.entitlements
      ? { ...plan.entitlements }
      : snapshotEntitlements;

    if (policy) {
      resolved.canUsePremiumPublicPage = readBooleanPolicy(
        policy,
        'canUsePremiumPublicPage',
        'can_use_premium_public_page',
      );
      resolved.canUseShortPremiumLink = readBooleanPolicy(
        policy,
        'canUseShortPremiumLink',
        'can_use_short_premium_link',
      );
      resolved.canUseCustomQRCode = readBooleanPolicy(
        policy,
        'canUseCustomQRCode',
        'can_use_custom_qr_code',
      );

      resolved.canUseAdvancedMenu = readBooleanPolicy(
        policy,
        'canUseAdvancedMenu',
        'can_use_advanced_menu',
      );
      resolved.canUseMenuCategories = readBooleanPolicy(
        policy,
        'canUseMenuCategories',
        'can_use_advanced_menu',
      );
      resolved.canUseMenuImages = readBooleanPolicy(
        policy,
        'canUseMenuImages',
        'can_use_advanced_menu',
      );
      resolved.canUseMenuVariations = readBooleanPolicy(
        policy,
        'canUseMenuVariations',
        'can_use_advanced_menu',
      );
      resolved.canUseMenuAddons = readBooleanPolicy(
        policy,
        'canUseMenuAddons',
        'can_use_advanced_menu',
      );
      resolved.canUseMenuCombos = readBooleanPolicy(
        policy,
        'canUseMenuCombos',
        'can_use_advanced_menu',
      );
      resolved.canScheduleItems = readBooleanPolicy(
        policy,
        'canScheduleItems',
        'can_use_advanced_menu',
      );

      resolved.canReceiveInternalOrders = readBooleanPolicy(
        policy,
        'canReceiveInternalOrders',
        'can_receive_internal_orders',
      );
      resolved.canUseOrdersPanel = readBooleanPolicy(
        policy,
        'canUseOrdersPanel',
        'can_receive_internal_orders',
      );
      resolved.canManageOrderStatus = readBooleanPolicy(
        policy,
        'canManageOrderStatus',
        'can_receive_internal_orders',
      );
      resolved.canCancelOrders = readBooleanPolicy(
        policy,
        'canCancelOrders',
        'can_receive_internal_orders',
      );
      resolved.canViewOrderHistory = readBooleanPolicy(
        policy,
        'canViewOrderHistory',
        'can_receive_internal_orders',
      );

      resolved.canUseMotoboyNetwork = readBooleanPolicy(
        policy,
        'canUseMotoboyNetwork',
        'can_use_motoboy_network',
      );
      resolved.canRequestDelivery = readBooleanPolicy(
        policy,
        'canRequestDelivery',
        'can_use_motoboy_network',
      );
      resolved.canTrackDelivery = readBooleanPolicy(
        policy,
        'canTrackDelivery',
        'can_use_motoboy_network',
      );
      resolved.canConfigureDeliveryArea = readBooleanPolicy(
        policy,
        'canConfigureDeliveryArea',
        'can_use_motoboy_network',
      );
      resolved.canSetDeliveryFees = readBooleanPolicy(
        policy,
        'canSetDeliveryFees',
        'can_use_motoboy_network',
      );
      resolved.canSetMinimumOrder = readBooleanPolicy(
        policy,
        'canSetMinimumOrder',
        'can_use_motoboy_network',
      );
      resolved.canUseOwnDelivery = readBooleanPolicy(
        policy,
        'canUseOwnDelivery',
        'can_use_motoboy_network',
      );

      resolved.canUsePromotions = readBooleanPolicy(
        policy,
        'canUsePromotions',
        'can_use_promotions',
      );
      resolved.canUseFeaturedPlacement = readBooleanPolicy(
        policy,
        'canUseFeaturedPlacement',
        'can_use_promotions',
      );
      resolved.canUseCoupons = readBooleanPolicy(
        policy,
        'canUseCoupons',
        'can_use_promotions',
      );
      resolved.canSchedulePromotions = readBooleanPolicy(
        policy,
        'canSchedulePromotions',
        'can_use_promotions',
      );

      resolved.canUseBasicAnalytics = readBooleanPolicy(
        policy,
        'canUseBasicAnalytics',
        'can_use_basic_analytics',
      );
      resolved.canUseAdvancedAnalytics = readBooleanPolicy(
        policy,
        'canUseAdvancedAnalytics',
        'can_use_advanced_analytics',
      );
      resolved.canExportReports = readBooleanPolicy(
        policy,
        'canExportReports',
        'can_use_advanced_analytics',
      );
      resolved.canViewRealtimeMetrics = readBooleanPolicy(
        policy,
        'canViewRealtimeMetrics',
        'can_use_basic_analytics',
      );
      resolved.canViewCustomerInsights = readBooleanPolicy(
        policy,
        'canViewCustomerInsights',
        'can_use_advanced_analytics',
      );

      resolved.maxMenuItems = readNullableNumberPolicy(policy, 'maxMenuItems', 'max_menu_items');
      resolved.maxPromotions = readNullableNumberPolicy(policy, 'maxPromotions', 'max_promotions');
      resolved.maxImages = readNullableNumberPolicy(policy, 'maxImages', 'max_images');
      resolved.maxCategories = readNullableNumberPolicy(policy, 'maxCategories', 'max_categories');
    }

    if (snapshot?.overrides) {
      Object.assign(resolved, snapshot.overrides);
    }

    resolved.planTier = plan?.code || subscription.plan_code || 'free';
    resolved.planName = plan?.name || 'Free';
    resolved.isActive =
      subscription.status_v2 === 'active' || subscription.status_v2 === 'trialing';
    this.syncGenericAliases(resolved);

    return resolved;
  }

  static async check(
    context: EntitlementContext,
    entitlement: keyof ResolvedEntitlements,
  ): Promise<boolean> {
    const resolved = await this.resolve(context);
    const value = new Map<
      keyof ResolvedEntitlements,
      ResolvedEntitlements[keyof ResolvedEntitlements]
    >(
      Object.entries(resolved) as [
        keyof ResolvedEntitlements,
        ResolvedEntitlements[keyof ResolvedEntitlements],
      ][],
    ).get(entitlement);

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (value === null) {
      return true;
    }

    return false;
  }

  static async hasShortPremiumLink(context: EntitlementContext): Promise<boolean> {
    return this.check(context, 'canUseShortPremiumLink');
  }

  private static syncGenericAliases(resolved: ResolvedEntitlements): void {
    resolved.canUsePremiumSite = resolved.canUsePremiumPublicPage;
    resolved.canUseShortLink = resolved.canUseShortPremiumLink;
    resolved.canUseAdvancedCatalog = resolved.canUseAdvancedMenu;
    resolved.canUseInternalOrders = resolved.canReceiveInternalOrders;
    resolved.canUseDeliveryRequests = resolved.canRequestDelivery;
    resolved.canUseDeliveryTracking = resolved.canTrackDelivery;
    resolved.canUseDeliveryNetwork = resolved.canUseMotoboyNetwork;
  }
}

export const entitlementResolver = EntitlementResolver;
