/**
 * 🥐 SALGADOS NICHE PRESET
 *
 * Nicho básico - Salgados e lanches rápidos.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const salgadosNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'salgados',
  publicLabel: 'Salgados',
  description: 'Salgados assados e fritos, lanches rápidos para eventos e dia a dia.',
  operationalType: 'fast_food',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,
  enabledCapabilities: [
    'basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions',
    'delivery','pickup','dine_in','payment_cash','payment_card','payment_pix',
    'order_management','custom_instructions','dietary_flags','photos',
  ],
  missingCapabilities: [],
  defaultConfig: {
    defaultMinimumOrder: 20,
    defaultDeliveryFee: 4,
    defaultDeliveryTimeMin: 20,
    defaultDeliveryTimeMax: 40,
    defaultAcceptsReservations: false,
    suggestedCategories: ['Salgados Assados','Salgados Fritos','Mini Salgados','Bebidas'],
    suggestedItems: ['Coxinha','Esfiha','Kibe','Risole','Empada'],
  },
  adminSections: ['basic_menu','variants','addons','combos','promotions','delivery_areas','operational_hours','order_management','analytics'],
  validationRules: { minPrice: 2, maxPrice: 50, maxVariantsPerItem: 3, maxAddonsPerItem: 8 },
  displayOrder: 30,
  tags: ['basic','fast-food','delivery','events','party'],
  icon: 'croissant',
  themeColor: '#f59e0b',
});
