/**
 * User Subscription Service
 *
 * Reader/capability gateway da assinatura do usuario. Nao possui autoridade de
 * escrita sobre user_subscriptions.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import { BillingEntitlementsRpcService } from './BillingEntitlementsRpcService';

type QueryError = {
  message?: string | null;
  code?: string | null;
};

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

type SubscriptionDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

const subscriptionDb = supabase as unknown as SubscriptionDbClient;

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_code: string;
  status_v2: string | null;
  status: string | null;
  subscription_scope: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  trial_ends_at?: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveSubscription {
  subscription_id: string;
  plan_code: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

function canonicalStatus(subscription: UserSubscription | null): string {
  return subscription?.status_v2 ?? subscription?.status ?? 'inactive';
}

export class SubscriptionService {
  /**
   * Obtem a assinatura de escopo user do usuario atual.
   * Assinaturas de Business/Profile/Worker nao podem tornar esta leitura ambigua.
   */
  static async getCurrentUserSubscription(): Promise<UserSubscription | null> {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await subscriptionDb
      .from<UserSubscription>('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscription_scope', 'user')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtem a assinatura ativa via broker server-side de entitlements.
   */
  static async getActiveSubscription(): Promise<ActiveSubscription | null> {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    return BillingEntitlementsRpcService.getActiveSubscription();
  }

  static async hasPlano(planCode: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser();
    if (!user) return false;
    return BillingEntitlementsRpcService.hasPlan(planCode);
  }

  static async hasFeature(feature: string): Promise<boolean> {
    const user = await SessionService.getCurrentUser();
    if (!user) return false;
    return BillingEntitlementsRpcService.hasFeature(feature);
  }

  static async getEntitlementLimit(entitlement: string): Promise<number> {
    const user = await SessionService.getCurrentUser();
    if (!user) return 0;
    return BillingEntitlementsRpcService.getEntitlementLimit(entitlement);
  }

  static async isActive(): Promise<boolean> {
    const status = canonicalStatus(await this.getCurrentUserSubscription());
    return status === 'active' || status === 'trialing';
  }

  static async isTrialing(): Promise<boolean> {
    return canonicalStatus(await this.getCurrentUserSubscription()) === 'trialing';
  }

  static async isCanceled(): Promise<boolean> {
    const subscription = await this.getCurrentUserSubscription();
    return (
      canonicalStatus(subscription) === 'canceled' ||
      subscription?.cancel_at_period_end === true
    );
  }

  static async isPastDue(): Promise<boolean> {
    return canonicalStatus(await this.getCurrentUserSubscription()) === 'past_due';
  }

  static async getCurrentPlanName(): Promise<string> {
    const active = await this.getActiveSubscription();
    return active?.plan_name || 'Free';
  }

  static async getCurrentPlanCode(): Promise<string> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.plan_code || 'free';
  }

  static async canUpgrade(): Promise<boolean> {
    const planCode = await this.getCurrentPlanCode();
    return planCode === 'free' || planCode === 'pro';
  }

  static async canDowngrade(): Promise<boolean> {
    const planCode = await this.getCurrentPlanCode();
    return planCode === 'pro' || planCode === 'delivery';
  }
}
