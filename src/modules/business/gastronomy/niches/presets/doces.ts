/**
 * 🧁 DOCES E BOLOS NICHE PRESET
 *
 * Nicho básico - Docerias e confeitarias.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const docesNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'doces',
  publicLabel: 'Doces & Bolos',
  description: 'Docerias, confeitarias, bolos personalizados e sobremesas.',
  operationalType: 'dessert',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Fatia, Pequeno, Médio, Grande
    'menu_addons',        // Adicionais: cobertura extra, velas
    'menu_combos',        // Combo bolo + bebida
    'menu_promotions',
    'delivery',
    'pickup',             // Bolos personalizados geralmente são retirada
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
    defaultMinimumOrder: 30,
    defaultDeliveryFee: 5,
    defaultDeliveryTimeMin: 30,
    defaultDeliveryTimeMax: 60,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Bolos',
      'Tortas',
      'Docinhos',
      'Sobremesas',
      'Bebidas',
    ],
    suggestedItems: [
      'Bolo de Chocolate',
      'Bolo de Cenoura',
      'Brigadeiro',
      'Beijinho',
      'Torta de Limão',
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
    maxPrice: 300,
    maxVariantsPerItem: 5,    // Fatia, Pequeno, Médio, Grande, Festa
    maxAddonsPerItem: 10,
  },

  displayOrder: 40,
  tags: ['basic', 'dessert', 'delivery', 'pickup', 'party', 'events'],
  icon: 'cake',
  themeColor: '#ec4899', // pink-500
});
