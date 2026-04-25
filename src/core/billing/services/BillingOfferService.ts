/**
 * BillingOfferService
 *
 * Centraliza o mapeamento entre ofertas comerciais e planos reais de billing.
 * O módulo consumidor trabalha com chaves genéricas de oferta, sem hardcode
 * de planCode, nome de plano ou preço.
 */

export type BillingOfferKey = 'catalog' | 'delivery';

export interface BillingOffer {
  key: BillingOfferKey;
  planCode: string;
  label: string;
  priceFallback: string;
  icon: 'crown' | 'zap';
}

const OFFERS: Record<BillingOfferKey, BillingOffer> = {
  catalog: {
    key: 'catalog',
    planCode: 'gastronomy_pro',
    label: 'Pro',
    priceFallback: 'R$ 49,90/mês',
    icon: 'crown',
  },
  delivery: {
    key: 'delivery',
    planCode: 'gastronomy_delivery',
    label: 'Delivery',
    priceFallback: 'R$ 99,90/mês',
    icon: 'zap',
  },
};

export class BillingOfferService {
  static getOffer(key: BillingOfferKey): BillingOffer {
    return OFFERS[key] ?? OFFERS.catalog;
  }
}
