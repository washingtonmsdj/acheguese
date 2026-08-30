/**
 * 🍺 BARES E PUBS NICHE PRESET
 *
 * Nicho complexo - Bares, pubs e cervejarias.
 * PREPARADO para implementação futura.
 *
 * @version 1.0.0 - Prepared
 * @status beta_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const baresNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'bares',
  publicLabel: 'Bares & Pubs',
  description: 'Bares, pubs e cervejarias com petiscos e chopps.',
  operationalType: 'bar',
  supportLevel: 'beta_enabled',
  isSelectable: false,
  isPublic: false,
  isBeta: true,
  enabledCapabilities: ['basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions','delivery','pickup','dine_in','table_reservation','payment_cash','payment_card','payment_pix','order_management','custom_instructions','dietary_flags','photos'],
  missingCapabilities: [],
  defaultConfig: {
    defaultMinimumOrder: 30,
    defaultDeliveryFee: 6,
    defaultDeliveryTimeMin: 25,
    defaultDeliveryTimeMax: 50,
    defaultAcceptsReservations: true,
    suggestedCategories: ['Cervejas','Chopes','Drinks','Petiscos','Porções','Bebidas não alcoólicas'],
    suggestedItems: ['Chopp','Cerveja Long Neck','Torresmo','Isca de Peixe','Calabresa Acebolada'],
  },
  adminSections: ['basic_menu','variants','addons','combos','promotions','delivery_areas','operational_hours','reservations','order_management','analytics'],
  validationRules: { minPrice: 5, maxPrice: 200, maxVariantsPerItem: 4, maxAddonsPerItem: 10 },
  displayOrder: 70,
  tags: ['complex','bar','alcohol','delivery','reservations','night'],
  icon: 'beer',
  themeColor: '#1d4ed8',
});
