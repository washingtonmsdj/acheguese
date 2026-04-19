/**
 * @deprecated Este arquivo está DEPRECADO para lógica de planos.
 * 
 * Use: @/core/billing/SubscriptionService para operações de assinatura
 * 
 * Motivo: Sistema de billing foi consolidado em core/billing.
 * Este arquivo deve ser mantido APENAS para integração Stripe específica,
 * mas toda lógica de planos/entitlements deve usar core/billing.
 * 
 * Migration:
 * ```typescript
 * // ANTES (DEPRECADO)
 * import { GastronomyStripeService } from '@/core/gastronomy/billing/StripeService';
 * 
 * // DEPOIS (CORRETO)
 * import { SubscriptionService } from '@/core/billing';
 * ```
 */

/**
 * GASTRONOMY STRIPE SERVICE — Integração com Stripe
 *
 * Centraliza toda a lógica de integração com Stripe para o vertical Gastronomia.
 * Gerencia assinaturas, pagamentos e sincronização com o banco de dados.
 *
 * Princípios:
 * - SSOT: Única fonte de verdade para operações Stripe
 * - Type-safe: Todas as operações são tipadas
 * - Error handling: Tratamento robusto de erros
 * - Idempotência: Operações podem ser repetidas sem efeitos colaterais
 */
import { logger } from '@/shared/utils/logger';
import Stripe from 'stripe';
import { GastronomyPlanTier } from './types';
// ══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ══════════════════════════════════════════════════════════════════════════

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_API_VERSION = '2023-10-16' as const;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
});

// ══════════════════════════════════════════════════════════════════════════
// PRICE IDS (configurar após criar produtos no Stripe Dashboard)
// ══════════════════════════════════════════════════════════════════════════

const PRICE_IDS = {
  [GastronomyPlanTier.FREE]: null, // Free não tem price_id
  [GastronomyPlanTier.PRO]: process.env.STRIPE_PRICE_ID_PRO || '',
  [GastronomyPlanTier.DELIVERY]: process.env.STRIPE_PRICE_ID_DELIVERY || '',
} as const;

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface CreateSubscriptionParams {
  businessId: string;
  planTier: GastronomyPlanTier.PRO | GastronomyPlanTier.DELIVERY;
  customerId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPlanTier: GastronomyPlanTier.PRO | GastronomyPlanTier.DELIVERY;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CreateCustomerParams {
  businessId: string;
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface StripeServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ══════════════════════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class GastronomyStripeService {
  
  // ────────────────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Cria um customer no Stripe
   * 
   * @param params - Parâmetros do customer
   * @returns Customer criado ou erro
   */
  static async createCustomer(
    params: CreateCustomerParams
  ): Promise<StripeServiceResult<Stripe.Customer>> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          business_id: params.businessId,
          ...params.metadata,
        },
      });
      
      return { data: customer, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar customer';
      logger.error('[StripeService] Erro ao criar customer:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Busca um customer por ID
   * 
   * @param customerId - ID do customer no Stripe
   * @returns Customer ou erro
   */
  static async getCustomer(
    customerId: string
  ): Promise<StripeServiceResult<Stripe.Customer>> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return { data: null, error: 'Customer foi deletado' };
      }
      
      return { data: customer as Stripe.Customer, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar customer';
      logger.error('[StripeService] Erro ao buscar customer:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Atualiza um customer
   * 
   * @param customerId - ID do customer
   * @param params - Dados a atualizar
   * @returns Customer atualizado ou erro
   */
  static async updateCustomer(
    customerId: string,
    params: Partial<Pick<CreateCustomerParams, 'email' | 'name' | 'metadata'>>
  ): Promise<StripeServiceResult<Stripe.Customer>> {
    try {
      const customer = await stripe.customers.update(customerId, {
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });
      
      return { data: customer, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar customer';
      logger.error('[StripeService] Erro ao atualizar customer:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Cria uma assinatura no Stripe
   * 
   * @param params - Parâmetros da assinatura
   * @returns Assinatura criada ou erro
   */
  static async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<StripeServiceResult<Stripe.Subscription>> {
    try {
      // Validar plan tier
      if (params.planTier === GastronomyPlanTier.FREE) {
        return { data: null, error: 'Plano Free não requer assinatura Stripe' };
      }
      
      // Obter price_id
      const priceId = PRICE_IDS[params.planTier];
      if (!priceId) {
        return { 
          data: null, 
          error: `Price ID não configurado para plano ${params.planTier}` 
        };
      }
      
      // Criar assinatura
      const subscription = await stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: priceId }],
        trial_period_days: params.trialDays,
        metadata: {
          business_id: params.businessId,
          plan_tier: params.planTier,
          ...params.metadata,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });
      
      return { data: subscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar assinatura';
      logger.error('[StripeService] Erro ao criar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Busca uma assinatura por ID
   * 
   * @param subscriptionId - ID da assinatura no Stripe
   * @returns Assinatura ou erro
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<StripeServiceResult<Stripe.Subscription>> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { data: subscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar assinatura';
      logger.error('[StripeService] Erro ao buscar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Atualiza uma assinatura (upgrade/downgrade)
   * 
   * @param params - Parâmetros da atualização
   * @returns Assinatura atualizada ou erro
   */
  static async updateSubscription(
    params: UpdateSubscriptionParams
  ): Promise<StripeServiceResult<Stripe.Subscription>> {
    try {
      // Validar plan tier
      if (params.newPlanTier === GastronomyPlanTier.FREE) {
        return { data: null, error: 'Use cancelSubscription para downgrade para Free' };
      }
      
      // Obter price_id
      const priceId = PRICE_IDS[params.newPlanTier];
      if (!priceId) {
        return { 
          data: null, 
          error: `Price ID não configurado para plano ${params.newPlanTier}` 
        };
      }
      
      // Buscar assinatura atual
      const currentSubscription = await stripe.subscriptions.retrieve(params.subscriptionId);
      
      // Atualizar assinatura
      const subscription = await stripe.subscriptions.update(params.subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: params.prorationBehavior || 'create_prorations',
        metadata: {
          ...currentSubscription.metadata,
          plan_tier: params.newPlanTier,
        },
      });
      
      return { data: subscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar assinatura';
      logger.error('[StripeService] Erro ao atualizar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Cancela uma assinatura
   * 
   * @param subscriptionId - ID da assinatura
   * @param immediately - Se true, cancela imediatamente. Se false, cancela no fim do período
   * @returns Assinatura cancelada ou erro
   */
  static async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<StripeServiceResult<Stripe.Subscription>> {
    try {
      if (immediately) {
        // Cancelar imediatamente
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return { data: subscription, error: null };
      } else {
        // Cancelar no fim do período
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return { data: subscription, error: null };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar assinatura';
      logger.error('[StripeService] Erro ao cancelar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Reativa uma assinatura que foi marcada para cancelamento
   * 
   * @param subscriptionId - ID da assinatura
   * @returns Assinatura reativada ou erro
   */
  static async reactivateSubscription(
    subscriptionId: string
  ): Promise<StripeServiceResult<Stripe.Subscription>> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      
      return { data: subscription, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reativar assinatura';
      logger.error('[StripeService] Erro ao reativar assinatura:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // PAYMENT METHODS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Cria um Setup Intent para adicionar método de pagamento
   * 
   * @param customerId - ID do customer
   * @returns Setup Intent ou erro
   */
  static async createSetupIntent(
    customerId: string
  ): Promise<StripeServiceResult<Stripe.SetupIntent>> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
      
      return { data: setupIntent, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar setup intent';
      logger.error('[StripeService] Erro ao criar setup intent:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Lista métodos de pagamento de um customer
   * 
   * @param customerId - ID do customer
   * @returns Lista de métodos de pagamento ou erro
   */
  static async listPaymentMethods(
    customerId: string
  ): Promise<StripeServiceResult<Stripe.PaymentMethod[]>> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      
      return { data: paymentMethods.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar métodos de pagamento';
      logger.error('[StripeService] Erro ao listar métodos de pagamento:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Define um método de pagamento como padrão
   * 
   * @param customerId - ID do customer
   * @param paymentMethodId - ID do método de pagamento
   * @returns Customer atualizado ou erro
   */
  static async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<StripeServiceResult<Stripe.Customer>> {
    try {
      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      return { data: customer, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao definir método padrão';
      logger.error('[StripeService] Erro ao definir método padrão:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // INVOICES
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Lista faturas de um customer
   * 
   * @param customerId - ID do customer
   * @param limit - Limite de resultados
   * @returns Lista de faturas ou erro
   */
  static async listInvoices(
    customerId: string,
    limit: number = 10
  ): Promise<StripeServiceResult<Stripe.Invoice[]>> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });
      
      return { data: invoices.data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar faturas';
      logger.error('[StripeService] Erro ao listar faturas:', error);
      return { data: null, error: message };
    }
  }
  
  /**
   * Busca uma fatura por ID
   * 
   * @param invoiceId - ID da fatura
   * @returns Fatura ou erro
   */
  static async getInvoice(
    invoiceId: string
  ): Promise<StripeServiceResult<Stripe.Invoice>> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return { data: invoice, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar fatura';
      logger.error('[StripeService] Erro ao buscar fatura:', error);
      return { data: null, error: message };
    }
  }
  
  // ────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────
  
  /**
   * Retorna o price_id para um plano
   * 
   * @param planTier - Tier do plano
   * @returns Price ID ou null
   */
  static getPriceId(planTier: GastronomyPlanTier): string | null {
    return PRICE_IDS[planTier];
  }
  
  /**
   * Verifica se um plano requer assinatura Stripe
   * 
   * @param planTier - Tier do plano
   * @returns true se requer assinatura
   */
  static requiresStripeSubscription(planTier: GastronomyPlanTier): boolean {
    return planTier !== GastronomyPlanTier.FREE;
  }
  
  /**
   * Converte status do Stripe para status do banco
   * 
   * @param stripeStatus - Status da assinatura no Stripe
   * @returns Status para o banco
   */
  static mapSubscriptionStatus(
    stripeStatus: Stripe.Subscription.Status
  ): 'active' | 'canceled' | 'past_due' | 'trialing' {
    const statusMap: Record<Stripe.Subscription.Status, 'active' | 'canceled' | 'past_due' | 'trialing'> = {
      'active': 'active',
      'canceled': 'canceled',
      'incomplete': 'past_due',
      'incomplete_expired': 'canceled',
      'past_due': 'past_due',
      'trialing': 'trialing',
      'unpaid': 'past_due',
      'paused': 'canceled',
    };
    
    return statusMap[stripeStatus] || 'canceled';
  }
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════

export { stripe };
