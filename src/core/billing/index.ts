/**
 * CORE BILLING — Sistema transversal de assinaturas
 *
 * SSOT: ponto unico de acesso para billing.
 * - BusinessSubscriptionService: leitura/gateway de assinatura de empresa.
 * - services/SubscriptionService: leitura/capabilities da assinatura do usuario.
 * - BillingService: checkout/portal Stripe.
 * - CatalogService/BillingPlanService: oferta publicada.
 */

// Types
export * from './types';

// Entitlements
export * from './entitlements';
export * from './entitlements-extended';

// Business subscription owner
export * from './BusinessSubscriptionService';
// Bridge temporario para callers antigos do barrel.
export { BusinessSubscriptionService as SubscriptionService } from './BusinessSubscriptionService';

// Services
export * from './services/BillingService';
export * from './services/BillingOfferService';

// Hooks
export * from './hooks/useBusinessSubscription';
export * from './hooks/useBillingPlans';
