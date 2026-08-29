/**
 * BILLING SERVICE
 *
 * Gateway para checkout/portal Stripe e leituras auxiliares de billing.
 * Planos exibidos no cliente sao adaptados do catalogo publicado pelo
 * BillingPlanService; billing_plans nao e fonte runtime de oferta/preco.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { SECURITY_DOMAINS } from '@/shared/config/security.config';
import {
  getAllowedRedirectOriginsFromEnv,
  navigateToSafeRedirect,
} from '@/shared/utils/safeRedirect';
import { BillingPlanService } from './BillingPlanService';

export interface CreateCheckoutParams {
  planCode: string;
  successUrl: string;
  cancelUrl: string;
  businessId?: string;
  subscriptionScope?: 'user' | 'business' | 'profile' | 'worker';
  entityFamily?: 'company' | 'professional' | 'worker';
  vertical?:
    | 'gastronomy'
    | 'health'
    | 'education'
    | 'services'
    | 'retail'
    | 'classifieds'
    | 'mobility_company'
    | 'mobility_driver'
    | 'mobility_courier';
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
  static async createCheckoutSession(
    params: CreateCheckoutParams,
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

  static async getPlans() {
    return BillingPlanService.getActivePlans();
  }

  static async getPlanByCode(code: string) {
    return BillingPlanService.getPlanByCode(code);
  }

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
