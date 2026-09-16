/**
 * Core Pricing - canonical persisted-rule repository instance.
 *
 * Mobility transaction prices are never calculated here. They are issued by
 * mobility-pricing-rpc as server-owned single-use quotes. This instance exists
 * for administrative/read access to persisted pricing rules.
 */

import { PricingService } from "./services/PricingService";
import type { PricingMode, PricingRule } from "./types";

const rawPricingService = PricingService.getInstance();

function isCommerciallyApproved(rule: PricingRule): boolean {
  return rule.metadata?.commercial_status === "approved";
}

function assertCanonicalRule(rule: PricingRule, mode: PricingMode): PricingRule {
  if (import.meta.env.PROD && !isCommerciallyApproved(rule)) {
    throw new Error(
      `Pricing rule for mode ${mode} is not commercially approved for production.`,
    );
  }
  return rule;
}

export const pricingService = new Proxy(rawPricingService, {
  get(target, property, receiver) {
    if (property === "getRule") {
      return async (mode: PricingMode): Promise<PricingRule> =>
        assertCanonicalRule(await target.getRule(mode), mode);
    }

    const value = Reflect.get(target, property, receiver);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
