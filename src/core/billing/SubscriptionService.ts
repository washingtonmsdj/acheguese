/**
 * @deprecated Compatibilidade temporaria.
 *
 * O owner explicito de assinatura de Business e BusinessSubscriptionService.
 * Este arquivo nao contem persistencia nem regra de negocio; existe apenas para
 * callers antigos que ainda importam @/core/billing/SubscriptionService.
 */
export {
  BusinessSubscriptionService as SubscriptionService,
  type ServiceResult,
} from "./BusinessSubscriptionService";
