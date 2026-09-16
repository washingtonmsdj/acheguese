/**
 * Core Pricing - Singleton Instance
 *
 * Instância canônica do PricingService.
 * Use esta instância em toda a aplicação.
 *
 * Production policy:
 * - persisted pricing rules are authoritative;
 * - historical fallback rules are never customer pricing;
 * - provisional/unapproved rules may be exercised in development, but production
 *   refuses to turn them into a customer-facing price;
 * - local hardcoded peak-hour windows/multipliers are disabled. Peak pricing may
 *   only return after schedule + multiplier evaluation is owned by the canonical
 *   persisted/server-side pricing contract.
 */

import { PricingService } from './services/PricingService';
import type { PricingMode, PricingRule } from './types';

const rawPricingService = PricingService.getInstance();

// PricingService still contains historical local peak-hour logic. Do not let the
// canonical runtime apply it while commercial policy is provisional. This is a
// fail-closed compatibility setting, not a second pricing owner.
rawPricingService.configure({ enablePeakHours: false });

function isCommerciallyApproved(rule: PricingRule): boolean {
  return rule.metadata?.commercial_status === 'approved';
}

function assertCanonicalRule(rule: PricingRule, mode: PricingMode): PricingRule {
  if (rule.id.startsWith('fallback-')) {
    throw new Error(
      `Canonical pricing rule unavailable for mode: ${mode}. Refusing hardcoded fallback pricing.`,
    );
  }

  if (import.meta.env.PROD && !isCommerciallyApproved(rule)) {
    throw new Error(
      `Pricing rule for mode ${mode} is not commercially approved for production.`,
    );
  }

  return rule;
}

export const pricingService = new Proxy(rawPricingService, {
  get(target, property, receiver) {
    if (property === 'getRule') {
      return async (mode: PricingMode): Promise<PricingRule> =>
        assertCanonicalRule(await target.getRule(mode), mode);
    }

    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(receiver) : value;
  },
});
