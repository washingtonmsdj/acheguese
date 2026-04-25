/**
 * 🍔 HAMBURGUER NICHE PRESET
 *
 * Nicho básico - Hamburguerias.
 * Funciona com cardápio padrão com bom suporte a customizações.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const hamburguerNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'hamburguer',
  publicLabel: 'Hambúrguer',
  description: 'Hamburguerias artesanais e fast-food com customizações.',
  operationalType: 'fast_food',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tipos de carne: bovina, frango, plant-based
    'menu_addons',        // Ingredientes extras: bacon, queijo, ovo, molhos
    'menu_combos',        // Combo burger + batata + bebida
    'menu_promotions',
    'delivery',
    'pickup',
    'dine_in',
    'table_reservation',
    'payment_cash',
    'payment_card',
    'payment_pix',
    'order_management',
    'custom_instructions', // Importante: "sem cebola", "ponto da carne"
    'dietary_flags',
    'photos',
  ],

  missingCapabilities: [],

  defaultConfig: {
    defaultMinimumOrder: 25,
    defaultDeliveryFee: 5,
    defaultDeliveryTimeMin: 25,
    defaultDeliveryTimeMax: 45,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Burgers Artesanais',
      'Burgers Tradicionais',
      'Vegetarianos',
      'Acompanhamentos',
      'Bebidas',
      'Milkshakes',
    ],
    suggestedItems: [
      'Smash Burger',
      'Cheeseburger',
      'Bacon Burger',
      'Veggie Burger',
      'Batatas Fritas',
    ],
    nicheSpecific: {
      meatPointOptions: ['mal_passado', 'ao_ponto', 'bem_passado'],
      commonAddons: [
        'bacon',
        'queijo_cheddar',
        'queijo_mussarela',
        'ovo',
        'cebola_caramelizada',
        'molho_especial',
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
    'reservations',
    'order_management',
    'analytics',
  ],

  validationRules: {
    minPrice: 15,
    maxPrice: 80,
    maxVariantsPerItem: 5,    // Vários tipos de carne + tamanhos
    maxAddonsPerItem: 20,     // Muitos ingredientes extras
    requiresPhoto: true,        // Fotos importantes para burgers
  },

  displayOrder: 5,
  tags: ['basic', 'fast-food', 'delivery', 'reservations', 'customizable', 'artesanal'],
  icon: 'beef',
  themeColor: '#b45309', // amber-700
});
