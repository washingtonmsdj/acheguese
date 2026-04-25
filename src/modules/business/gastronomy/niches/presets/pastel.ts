/**
 * 🥟 PASTEL NICHE PRESET
 *
 * Nicho complexo - Pastelarias com meio a meio.
 * PREPARADO para implementação futura.
 *
 * @version 1.0.0 - Prepared
 * @status beta_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const pastelNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'pastel',
  publicLabel: 'Pastel',
  description: 'Pastelarias com suporte a meio a meio e múltiplos recheios.',
  operationalType: 'complex',
  supportLevel: 'beta_enabled',
  isSelectable: false,
  isPublic: false,
  isBeta: true,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Médio, Grande
    'menu_addons',        // Coberturas: chocolate, doce de leite
    'menu_combos',        // Combo pastel + suco
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
    'photos',
  ],

  missingCapabilities: [
    'pastel_half_half',   // Meio a meio de sabores
    'pastel_sizes',       // Tamanhos específicos
    'pastel_fillings',    // Catálogo de recheios
  ],

  defaultConfig: {
    defaultMinimumOrder: 20,
    defaultDeliveryFee: 5,
    defaultDeliveryTimeMin: 20,
    defaultDeliveryTimeMax: 45,
    defaultAcceptsReservations: false,
    suggestedCategories: [
      'Pastéis Salgados',
      'Pastéis Doces',
      'Bebidas',
      'Porções',
    ],
    suggestedItems: [
      'Pastel de Carne',
      'Pastel de Queijo',
      'Pastel de Pizza',
      'Pastel de Palmito',
      'Pastel de Chocolate',
    ],
    nicheSpecific: {
      maxFlavorsPerPastel: 2,   // Meio a meio
      sizes: [
        { key: 'medio', name: 'Médio', maxFlavors: 1 },
        { key: 'grande', name: 'Grande', maxFlavors: 2 },
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
    'pastel_builder',
  ],

  validationRules: {
    minPrice: 8,
    maxPrice: 40,
    maxVariantsPerItem: 3,
    maxAddonsPerItem: 10,
  },

  displayOrder: 60,
  tags: ['complex', 'fast-food', 'delivery', 'half-half'],
  icon: 'triangle',
  themeColor: '#facc15', // yellow-400
});
