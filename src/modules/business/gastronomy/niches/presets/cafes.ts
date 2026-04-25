/**
 * ☕ CAFES NICHE PRESET
 *
 * Nicho básico - Cafeterias e coffee shops.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const cafesNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'cafes',
  publicLabel: 'Cafés',
  description: 'Cafeterias, coffee shops e casas de café especial.',
  operationalType: 'bakery',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: P (240ml), M (360ml), G (480ml)
    'menu_addons',        // Adicionais: leite vegetal, xarope, chantilly
    'menu_combos',        // Combo café + pão de queijo
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
    'photos',
  ],

  missingCapabilities: [],

  defaultConfig: {
    defaultMinimumOrder: 15,
    defaultDeliveryFee: 4,
    defaultDeliveryTimeMin: 15,
    defaultDeliveryTimeMax: 35,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Cafés',
      'Capuccinos',
      'Bebidas Quentes',
      'Bebidas Geladas',
      'Lanches',
      'Doces',
    ],
    suggestedItems: [
      'Café Expresso',
      'Cappuccino',
      'Latte',
      'Pão de Queijo',
      'Croissant',
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
    minPrice: 3,
    maxPrice: 50,
    maxVariantsPerItem: 4,
    maxAddonsPerItem: 8,
  },

  displayOrder: 45,
  tags: ['basic', 'coffee', 'breakfast', 'delivery', 'reservations'],
  icon: 'coffee',
  themeColor: '#78350f', // amber-900
});
