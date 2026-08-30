/**
 * 🍕 PIZZA NICHE PRESET
 *
 * Configuração para pizzarias - nicho complexo a ser implementado.
 * Este arquivo define a estrutura completa que será desenvolvida na próxima etapa.
 *
 * @status full_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

const pizzaCapabilities = [
  'pizza_sizes',
  'pizza_flavors',
  'pizza_half_half',
  'pizza_multi_flavor',
  'pizza_crusts',
  'pizza_crust_stuffing',
  'pizza_edge_rules',
] as const;

const pizzaAdminSections = [
  'pizza_sizes',
  'pizza_flavors',
  'pizza_crusts',
  'pizza_pricing',
] as const;

export const pizzaNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'pizza',
  publicLabel: 'Pizzaria',
  description: 'Pizzarias com suporte a múltiplos sabores, meio a meio, bordas recheadas e regras de preço específicas.',
  operationalType: 'complex',
  supportLevel: 'full_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,
  enabledCapabilities: [
    'basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions',
    ...pizzaCapabilities,
    'delivery','pickup','dine_in','table_reservation','payment_cash','payment_card',
    'payment_pix','order_management','custom_instructions','dietary_flags','photos',
  ],
  missingCapabilities: [],
  defaultConfig: {
    defaultMinimumOrder: 30,
    defaultDeliveryFee: 5,
    defaultDeliveryTimeMin: 35,
    defaultDeliveryTimeMax: 60,
    defaultAcceptsReservations: true,
    defaultPaymentMethods: ['cash','credit_card','debit_card','pix','online'],
    suggestedCategories: ['Pizzas Tradicionais','Pizzas Especiais','Pizzas Doces','Bebidas','Sobremesas'],
    suggestedItems: ['Pizza Margherita','Pizza Calabresa','Pizza Portuguesa','Pizza Quatro Queijos','Pizza de Chocolate'],
    nicheSpecific: {
      maxFlavorsPerPizza: 4,
      defaultCrustTypes: ['tradicional','fina','pan','integral'],
      defaultSizes: [
        { key: 'broto', name: 'Broto', slices: 4, diameter: 20 },
        { key: 'media', name: 'Média', slices: 6, diameter: 30 },
        { key: 'grande', name: 'Grande', slices: 8, diameter: 35 },
        { key: 'familia', name: 'Família', slices: 12, diameter: 45 },
      ],
      crustStuffingOptions: [
        { key: 'catupiry', name: 'Catupiry', priceAdjustment: 8 },
        { key: 'cheddar', name: 'Cheddar', priceAdjustment: 8 },
        { key: 'chocolate', name: 'Chocolate', priceAdjustment: 10 },
        { key: 'doce_leite', name: 'Doce de Leite', priceAdjustment: 10 },
      ],
    },
  },
  adminSections: [
    'basic_menu','variants','addons','combos','promotions','delivery_areas',
    'operational_hours','reservations','order_management','analytics',
    ...pizzaAdminSections,
  ],
  validationRules: {
    minPrice: 20,
    maxPrice: 500,
    maxVariantsPerItem: 4,
    maxAddonsPerItem: 10,
    requiresDescription: false,
    requiresPhoto: true,
  },
  displayOrder: 1,
  tags: ['complex','delivery','reservations','multi-flavor','family'],
  icon: 'pizza',
  themeColor: '#ef4444',
});
