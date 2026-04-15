/**
 * CORE BILLING — Sistema transversal de assinaturas
 *
 * SSOT: Ponto único de acesso para todo o sistema de billing.
 * 
 * Uso:
 * ```typescript
 * import { useBusinessSubscription, EntitlementsService, PlanTier } from '@/core/billing';
 * 
 * const { planTier, entitlements } = useBusinessSubscription(businessId);
 * 
 * if (EntitlementsService.canUsePromotions(planTier)) {
 *   // Mostrar recurso
 * }
 * ```
 */

// Types
export * from './types';

// Plans
export * from './plans';

// Entitlements (SSOT)
export * from './entitlements';
export * from './entitlements-extended';

// Services
export * from './SubscriptionService';

// Hooks
export * from './hooks/useBusinessSubscription';

