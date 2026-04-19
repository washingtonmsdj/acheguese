/**
 * ══════════════════════════════════════════════════════════════════════════
 * BILLING SERVICE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Serviço para gerenciar operações de billing (checkout, portal, etc).
 * 
 * IMPORTANTE: Usa edge functions - NUNCA service_role no frontend.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/client';
export interface CreateCheckoutParams {
  planCode: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface CreatePortalResponse {
  url: string;
}

export class BillingService {
  /**
   * Cria uma sessão de checkout do Stripe
   */
  static async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResponse> {
    const { data, error } = await supabase.functions.invoke('billing-create-checkout', {
      body: params,
    });

    if (error) {
      logger.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return data;
  }

  /**
   * Cria uma sessão do Stripe Customer Portal
   */
  static async createPortalSession(returnUrl: string): Promise<CreatePortalResponse> {
    const { data, error } = await supabase.functions.invoke('billing-create-portal', {
      body: { returnUrl },
    });

    if (error) {
      logger.error('Error creating portal session:', error);
      throw new Error(error.message || 'Failed to create portal session');
    }

    return data;
  }

  /**
   * Redireciona para o checkout do Stripe
   */
  static async redirectToCheckout(params: CreateCheckoutParams): Promise<void> {
    const { url } = await this.createCheckoutSession(params);
    window.location.href = url;
  }

  /**
   * Redireciona para o portal do cliente
   */
  static async redirectToPortal(returnUrl: string): Promise<void> {
    const { url } = await this.createPortalSession(returnUrl);
    window.location.href = url;
  }

  /**
   * Obtém todos os planos disponíveis
   */
  static async getPlans() {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Error fetching plans:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtém um plano específico por código
   */
  static async getPlanByCode(code: string) {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching plan:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtém histórico de transações do usuário
   */
  static async getUserTransactions(userId: string) {
    const { data, error } = await supabase
      .from('billing_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching transactions:', error);
      throw error;
    }

    return data;
  }
}
