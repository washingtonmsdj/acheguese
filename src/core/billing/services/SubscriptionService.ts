/**
 * ══════════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION SERVICE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Serviço para gerenciar assinaturas de usuários.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_code: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  metadata: Record<string, any>;
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

export class SubscriptionService {
  /**
   * Obtém a assinatura do usuário atual
   */
  static async getCurrentUserSubscription(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return null;
      }
      logger.error('Error fetching subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtém a assinatura ativa do usuário (via função SQL)
   */
  static async getActiveSubscription(): Promise<ActiveSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('get_user_active_subscription', {
      p_user_id: user.id,
    });

    if (error) {
      logger.error('Error fetching active subscription:', error);
      throw error;
    }

    return data?.[0] || null;
  }

  /**
   * Verifica se o usuário tem um plano específico
   */
  static async hasPlano(planCode: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('user_has_plan', {
      p_user_id: user.id,
      p_plan_code: planCode,
    });

    if (error) {
      logger.error('Error checking plan:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Verifica se o usuário tem acesso a uma feature
   */
  static async hasFeature(feature: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('user_has_feature', {
      p_user_id: user.id,
      p_feature: feature,
    });

    if (error) {
      logger.error('Error checking feature:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Obtém o limite de um entitlement
   */
  static async getEntitlementLimit(entitlement: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }

    const { data, error } = await supabase.rpc('get_user_entitlement_limit', {
      p_user_id: user.id,
      p_entitlement: entitlement,
    });

    if (error) {
      logger.error('Error getting entitlement limit:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Verifica se a assinatura está ativa
   */
  static async isActive(): Promise<boolean> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  }

  /**
   * Verifica se a assinatura está em trial
   */
  static async isTrialing(): Promise<boolean> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.status === 'trialing';
  }

  /**
   * Verifica se a assinatura está cancelada
   */
  static async isCanceled(): Promise<boolean> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.cancel_at_period_end === true;
  }

  /**
   * Verifica se a assinatura está vencida
   */
  static async isPastDue(): Promise<boolean> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.status === 'past_due';
  }

  /**
   * Obtém o nome do plano atual
   */
  static async getCurrentPlanName(): Promise<string> {
    const active = await this.getActiveSubscription();
    return active?.plan_name || 'Free';
  }

  /**
   * Obtém o código do plano atual
   */
  static async getCurrentPlanCode(): Promise<string> {
    const subscription = await this.getCurrentUserSubscription();
    return subscription?.plan_code || 'free';
  }

  /**
   * Verifica se o usuário pode fazer upgrade
   */
  static async canUpgrade(): Promise<boolean> {
    const planCode = await this.getCurrentPlanCode();
    return planCode === 'free' || planCode === 'pro';
  }

  /**
   * Verifica se o usuário pode fazer downgrade
   */
  static async canDowngrade(): Promise<boolean> {
    const planCode = await this.getCurrentPlanCode();
    return planCode === 'pro' || planCode === 'delivery';
  }
}

