/**
 * 🫐 ACAI / SORVETE NICHE PRESET
 *
 * Nicho complexo - Açaí, sorvetes e monte seu.
 * PREPARADO para implementação futura.
 *
 * @version 1.0.0 - Prepared
 * @status beta_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const acaiNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'acai',
  publicLabel: 'Açaí & Sorvete',
  description: 'Açaí, sorvetes e frozen yogurt com montagem personalizada.',
  operationalType: 'complex',
  supportLevel: 'beta_enabled',
  isSelectable: false,
  isPublic: false,
  isBeta: true,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: 300ml, 500ml, 700ml
    'menu_addons',        // Complementos: granola, banana, leite em pó
    'menu_combos',        // Combo açaí + tapioca
    'menu_promotions',
    'delivery',
    'pickup',
    'dine_in',
    'payment_cash',
    'payment_card',
    'payment_pix',
    'order_management',
    'custom_instructions',
    'dietary_flags',
    'nutrition_info',
    'photos',
  ],

  missingCapabilities: [
    'acai_base_sizes',       // Tamanhos específicos de base
    'acai_toppings',         // Gerenciamento de complementos
    'acai_syrups',           // Caldas
    'acai_fruit_selection',  // Escolha de frutas
  ],

  defaultConfig: {
    defaultMinimumOrder: 20,
    defaultDeliveryFee: 4,
    defaultDeliveryTimeMin: 15,
    defaultDeliveryTimeMax: 35,
    defaultAcceptsReservations: false,
    suggestedCategories: [
      'Açaí Tradicional',
      'Açaí Premium',
      'Sorvetes',
      'Milkshakes',
      'Tapiocas',
    ],
    suggestedItems: [
      'Açaí 300ml',
      'Açaí 500ml',
      'Açaí 700ml',
      'Sorvete Casquinha',
      'Milkshake',
    ],
    nicheSpecific: {
      baseSizes: [
        { key: '300ml', name: '300ml', ml: 300 },
        { key: '500ml', name: '500ml', ml: 500 },
        { key: '700ml', name: '700ml', ml: 700 },
      ],
      toppingCategories: [
        'frutas',
        'caldas',
        'paes-queijos',
        'cereais',
        'especiais',
      ],
    },
  },

  adminSections: [
    'basic_menu',
    'variants',
    'addons',
    'combos',
    'promotions',
    'delivery_areas',
    'operational_hours',
    'order_management',
    'analytics',
    // Para implementação futura
    'acai_builder',
  ],

  validationRules: {
    minPrice: 8,
    maxPrice: 60,
    maxVariantsPerItem: 4,
    maxAddonsPerItem: 25,     // Muitos complementos possíveis
  },

  displayOrder: 55,
  tags: ['complex', 'dessert', 'delivery', 'customizable', 'cold'],
  icon: 'ice-cream',
  themeColor: '#7c3aed', // violet-600
});
