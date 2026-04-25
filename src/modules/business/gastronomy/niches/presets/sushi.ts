/**
 * 🍣 SUSHI / JAPONESA NICHE PRESET
 *
 * Nicho complexo - Sushis, sashimis e comida japonesa.
 * PREPARADO para implementação futura.
 *
 * @version 1.0.0 - Prepared
 * @status beta_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const sushiNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'sushi',
  publicLabel: 'Japonesa / Sushi',
  description: 'Comida japonesa com sushis, sashimis, combinados e suporte a montagem personalizada.',
  operationalType: 'complex',
  supportLevel: 'beta_enabled',
  isSelectable: false,
  isPublic: false,
  isBeta: true,

  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: 10 peças, 20 peças, 30 peças
    'menu_addons',        // Molhos: shoyu, tarê, wasabi extra
    'menu_combos',        // Combinados fixos
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
    'sushi_piece_count',       // Contador de peças exato
    'sushi_combinado_builder', // Monte seu combinado
    'sushi_sashimi_weight',    // Sashimi por grama
  ],

  defaultConfig: {
    defaultMinimumOrder: 50,
    defaultDeliveryFee: 7,
    defaultDeliveryTimeMin: 35,
    defaultDeliveryTimeMax: 60,
    defaultAcceptsReservations: true,
    suggestedCategories: [
      'Sushis',
      'Sashimis',
      'Combinados',
      'Hot Rolls',
      'Temakis',
      'Entradas',
    ],
    suggestedItems: [
      'Salmão',
      'Atum',
      'Peixe Branco',
      'Hot Roll',
      'Temaki',
    ],
    nicheSpecific: {
      pieceCounts: [4, 8, 10, 12, 16, 20, 30, 40, 50],
      sashimiUnits: ['gramas', 'fatias'],
      defaultCombinadoPieces: 30,
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
    'sushi_builder',
    'sushi_pieces',
  ],

  validationRules: {
    minPrice: 8,
    maxPrice: 300,
    maxVariantsPerItem: 6,
    maxAddonsPerItem: 10,
    requiresPhoto: true,
  },

  displayOrder: 50,
  tags: ['complex', 'japanese', 'delivery', 'reservations', 'pieces', 'raw-fish'],
  icon: 'fish',
  themeColor: '#06b6d4', // cyan-500
});
