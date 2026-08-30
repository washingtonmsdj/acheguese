/**
 * 🥙 ARABE NICHE PRESET
 *
 * Nicho básico - Comida árabe.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const arabeNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'arabe',
  publicLabel: 'Árabe',
  description: 'Comida árabe tradicional com esfihas, kibes e quibes.',
  operationalType: 'fast_food',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Pequena, Média, Grande
    'menu_addons',        // Adicionais: queijo, carne extra
    'menu_combos',        // Combo esfiha + bebida
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
    defaultMinimumOrder: 25,
    defaultDeliveryFee: 5,
    defaultDeliveryTimeMin: 30,
    defaultDeliveryTimeMax: 50,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Esfihas',
      'Kibes',
      'Pratos',
      'Bebidas',
    ],
    suggestedItems: [
      'Esfiha de Carne',
      'Esfiha de Queijo',
      'Kibe Frito',
      'Quibe Cru',
      'Tabule',
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
    minPrice: 5,
    maxPrice: 80,
    maxVariantsPerItem: 3,
    maxAddonsPerItem: 8,
  },

  displayOrder: 20,
  tags: ['basic', 'fast-food', 'delivery', 'reservations', 'traditional'],
  icon: 'cookie',
  themeColor: '#eab308', // yellow-500
});
