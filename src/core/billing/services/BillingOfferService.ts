/**
 * BillingOfferService
 *
 * Centraliza o mapeamento entre ofertas comerciais e os codigos publicos
 * canonicos usados pelo Billing. Preco e beneficios nunca nascem aqui: a UI
 * resolve esses dados no catalogo publicado.
 */

export type BillingOfferKey = 'catalog' | 'delivery';

export interface BillingOffer {
  key: BillingOfferKey;
  planCode: 'pro' | 'delivery';
  label: string;
  icon: 'crown' | 'zap';
}

const OFFERS: Record<BillingOfferKey, BillingOffer> = {
  catalog: {
    key: 'catalog',
    planCode: 'pro',
    label: 'Pro',
    icon: 'crown',
  },
  delivery: {
    key: 'delivery',
    planCode: 'delivery',
    label: 'Delivery',
    icon: 'zap',
  },
};

export class BillingOfferService {
  static getOffer(key: BillingOfferKey): BillingOffer {
    switch (key) {
      case 'delivery':
        return OFFERS.delivery;
      case 'catalog':
      default:
        return OFFERS.catalog;
    }
  }
}
