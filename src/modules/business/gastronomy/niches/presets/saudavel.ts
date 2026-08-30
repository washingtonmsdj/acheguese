/**
 * 🥗 SAUDAVEL NICHE PRESET
 *
 * Nicho básico - Comida saudável, fitness e low-carb.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const saudavelNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'saudavel',
  publicLabel: 'Saudável',
  description: 'Comida saudável, fitness, low-carb, proteica e nutricionalmente balanceada.',
  operationalType: 'restaurant',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,
  enabledCapabilities: [
    'basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions',
    'delivery','pickup','dine_in','table_reservation','payment_cash','payment_card',
    'payment_pix','order_management','custom_instructions','dietary_flags','nutrition_info','photos',
  ],
  missingCapabilities: [],
  defaultConfig: {
    defaultMinimumOrder: 35,
    defaultDeliveryFee: 6,
    defaultDeliveryTimeMin: 25,
    defaultDeliveryTimeMax: 50,
    defaultAcceptsReservations: true,
    suggestedCategories: ['Saladas','Bowls','Low Carb','Proteicos','Vegetarianos','Bebidas Detox'],
    suggestedItems: ['Bowl de Salmão','Salada Caesar Fitness','Wrap Low Carb','Omelete de Claras','Smoothie Verde'],
  },
  adminSections: ['basic_menu','variants','addons','combos','promotions','delivery_areas','operational_hours','reservations','order_management','analytics'],
  validationRules: { minPrice: 15, maxPrice: 80, maxVariantsPerItem: 3, maxAddonsPerItem: 12, requiresDescription: true },
  displayOrder: 25,
  tags: ['basic','healthy','fitness','delivery','low-carb','protein'],
  icon: 'leaf',
  themeColor: '#10b981',
});
