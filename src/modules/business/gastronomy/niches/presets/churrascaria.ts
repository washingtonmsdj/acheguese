/**
 * 🥩 CHURRASCARIA / CARNES NICHE PRESET
 *
 * Nicho complexo - Churrascarias e açougues com venda por peso.
 * PREPARADO para implementação futura.
 *
 * @version 1.0.0 - Prepared
 * @status beta_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const churrascariaNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'churrascaria',
  publicLabel: 'Carnes & Churrascaria',
  description: 'Churrascarias, churrasquinho e açougues com venda por peso e rodízio.',
  operationalType: 'complex',
  supportLevel: 'beta_enabled',
  isSelectable: false,
  isPublic: false,
  isBeta: true,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Porções: Pequena, Média, Grande
    'menu_addons',        // Acompanhamentos: arroz, vinagrete, farofa
    'menu_combos',        // Combo carne + 2 acompanhamentos
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

  missingCapabilities: [
    'meat_weight_pricing',    // Preço por kg
    'meat_cut_selection',     // Escolha de cortes
    'meat_point_selection',   // Ponto da carne
  ],

  defaultConfig: {
    defaultMinimumOrder: 50,
    defaultDeliveryFee: 8,
    defaultDeliveryTimeMin: 40,
    defaultDeliveryTimeMax: 70,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Carnes Bovinas',
      'Carnes Suínas',
      'Frangos',
      'Linguiças',
      'Porções',
      'Acompanhamentos',
    ],
    suggestedItems: [
      'Picanha',
      'Costela',
      'Linguiça',
      'Frango',
      'Arroz',
    ],
    nicheSpecific: {
      weightUnit: 'kg',
      pricePerKg: true,
      defaultPortionSize: 0.5,  // 500g padrão
      meatPoints: ['mal_passado', 'ao_ponto', 'bem_passado'],
      cuts: [
        'picanha', 'costela', 'maminha', 'fraldinha',
        'linguica', 'asa', 'coxa', 'peito',
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
    // Para implementação futura
    'meat_cuts',
    'meat_pricing',
  ],

  validationRules: {
    minPrice: 30,
    maxPrice: 500,
    maxVariantsPerItem: 4,
    maxAddonsPerItem: 15,
  },

  displayOrder: 65,
  tags: ['complex', 'meat', 'delivery', 'reservations', 'weight-pricing'],
  icon: 'beef',
  themeColor: '#991b1b', // red-800
});
