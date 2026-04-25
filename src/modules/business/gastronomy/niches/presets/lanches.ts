/**
 * 🥪 LANCHES NICHE PRESET
 *
 * Nicho básico - Lanches e sanduíches simples.
 * Funciona com cardápio padrão (categorias + itens + variações + adicionais).
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const lanchesNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'lanches',
  publicLabel: 'Lanches',
  description: 'Lanchonetes e sanduiches simples com cardápio padrão.',
  operationalType: 'fast_food',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Pequeno, Médio, Grande
    'menu_addons',        // Adicionais: bacon, queijo, ovo
    'menu_combos',        // Combo lanche + batata + bebida
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

  missingCapabilities: [],

  defaultConfig: {
    defaultMinimumOrder: 15,
    defaultDeliveryFee: 4,
    defaultDeliveryTimeMin: 20,
    defaultDeliveryTimeMax: 45,
    defaultAcceptsReservations: false,
    suggestedCategories: [
      'Sanduíches',
      'Bebidas',
      'Acompanhamentos',
      'Sobremesas',
    ],
    suggestedItems: [
      'X-Burger',
      'X-Salada',
      'X-Bacon',
      'Misto Quente',
      'Suco Natural',
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
    'order_management',
    'analytics',
  ],

  validationRules: {
    minPrice: 5,
    maxPrice: 100,
    maxVariantsPerItem: 3,    // Pequeno, Médio, Grande
    maxAddonsPerItem: 15,
  },

  displayOrder: 10,
  tags: ['basic', 'fast-food', 'delivery', 'simple'],
  icon: 'sandwich',
  themeColor: '#f97316', // orange-500
});
