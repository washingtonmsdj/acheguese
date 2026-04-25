/**
 * 🍛 BRASILEIRA NICHE PRESET
 *
 * Nicho básico - Comida brasileira tradicional.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const brasileiraNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'brasileira',
  publicLabel: 'Brasileira',
  description: 'Comida brasileira tradicional, pratos à la carte e executivos.',
  operationalType: 'restaurant',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Individual, Para 2, Família
    'menu_addons',        // Adicionais: arroz extra, farofa
    'menu_combos',        // Combo prato + suco + sobremesa
    'menu_promotions',
    'delivery',
    'pickup',
    'dine_in',
    'table_reservation',
    'payment_cash',
    'payment_card',
    'payment_pix',
    'order_management',
    'custom_instructions',
    'dietary_flags',
    'nutrition_info',     // Calorias importantes para pratos
    'photos',
  ],

  missingCapabilities: [],

  defaultConfig: {
    defaultMinimumOrder: 30,
    defaultDeliveryFee: 6,
    defaultDeliveryTimeMin: 40,
    defaultDeliveryTimeMax: 70,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Entradas',
      'Pratos Principais',
      'Executivos',
      'Sobremesas',
      'Bebidas',
    ],
    suggestedItems: [
      'Feijoada',
      'PF - Prato Feito',
      'Bife Acebolado',
      'Frango Grelhado',
      'Peixe Frito',
    ],
  },

  adminSections: [
    'basic_menu',
    'variants',
    'addons',
    'combos',
    'promotions',
    'delivery_areas',
    'operational_hours',
    'reservations',
    'order_management',
    'analytics',
  ],

  validationRules: {
    minPrice: 15,
    maxPrice: 150,
    maxVariantsPerItem: 3,
    maxAddonsPerItem: 10,
  },

  displayOrder: 15,
  tags: ['basic', 'restaurant', 'delivery', 'reservations', 'traditional'],
  icon: 'bean',
  themeColor: '#22c55e', // green-500
});
