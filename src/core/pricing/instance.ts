/**
 * Core Pricing - Singleton Instance
 *
 * Instância canônica do PricingService.
 * Use esta instância em toda a aplicação.
 *
 * Runtime policy: persisted pricing rules are authoritative. PricingService still
 * contains historical fallback definitions for compatibility/tests, but the
 * application singleton must never turn those hardcoded values into an official
 * customer price. If the database rule is unavailable, pricing fails closed.
 */

import { PricingService } from './services/PricingService';
import type { PricingMode, PricingRule } from './types';

const rawPricingService = PricingService.getInstance();

function assertCanonicalRule(rule: PricingRule, mode: PricingMode): PricingRule {
  if (rule.id.startsWith('fallback-')) {
    throw new Error(
      `Canonical pricing rule unavailable for mode: ${mode}. Refusing hardcoded fallback pricing.`,
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
