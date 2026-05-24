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
import { supabase } from '@/integrations/supabase/supabase';
import { SECURITY_DOMAINS } from '@/config/security.config';
import {
  getAllowedRedirectOriginsFromEnv,
  navigateToSafeRedirect,
} from '@/shared/utils/safeRedirect';

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

const BILLING_REDIRECT_ORIGINS = getAllowedRedirectOriginsFromEnv(
  'VITE_ALLOWED_BILLING_REDIRECT_ORIGINS',
  [
    SECURITY_DOMAINS.STRIPE_CHECKOUT.url,
    SECURITY_DOMAINS.STRIPE_BILLING_PORTAL.url,
  ],
);

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
    const redirected = navigateToSafeRedirect(url, {
      allowedOrigins: BILLING_REDIRECT_ORIGINS,
      allowRelative: false,
      context: 'billing-checkout',
    });

    if (!redirected) {
      throw new Error('URL de checkout bloqueada pela politica de seguranca');
    }
  }

  /**
   * Redireciona para o portal do cliente
   */
  static async redirectToPortal(returnUrl: string): Promise<void> {
    const { url } = await this.createPortalSession(returnUrl);
    const redirected = navigateToSafeRedirect(url, {
      allowedOrigins: BILLING_REDIRECT_ORIGINS,
      allowRelative: false,
      context: 'billing-portal',
    });

    if (!redirected) {
      throw new Error('URL do portal bloqueada pela politica de seguranca');
    }
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

