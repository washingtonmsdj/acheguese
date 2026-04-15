/**
 * Core Pricing - Singleton Instance
 *
 * Instância canônica do PricingService.
 * Use esta instância em toda a aplicação.
 */

import { PricingService } from './services/PricingService';

export const pricingService = PricingService.getInstance();