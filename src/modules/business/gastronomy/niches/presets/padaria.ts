/**
 * 🥖 PADARIA NICHE PRESET
 *
 * Nicho básico - Padarias e cafés da manhã.
 *
 * @version 1.0.0
 * @status basic_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '@/core/business/niches/types';

export const padariaNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'padaria',
  publicLabel: 'Padaria',
  description: 'Padarias com pães, bolos, cafés da manhã e produtos de confeitaria.',
  operationalType: 'bakery',
  supportLevel: 'basic_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,
  enabledCapabilities: ['basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions','delivery','pickup','dine_in','table_reservation','payment_cash','payment_card','payment_pix','order_management','custom_instructions','dietary_flags','photos'],
  missingCapabilities: [],
  defaultConfig: {
    defaultMinimumOrder: 15,
    defaultDeliveryFee: 4,
    defaultDeliveryTimeMin: 15,
    defaultDeliveryTimeMax: 35,
    defaultAcceptsReservations: true,
    suggestedCategories: ['Pães','Bolos','Doces','Salgados','Cafés','Café da Manhã'],
    suggestedItems: ['Pão Francês','Croissant','Bolo de Chocolate','Café com Leite','Pão na Chapa'],
  },
  adminSections: ['basic_menu','variants','addons','combos','promotions','delivery_areas','operational_hours','reservations','order_management','analytics'],
  validationRules: { minPrice: 2, maxPrice: 80, maxVariantsPerItem: 4, maxAddonsPerItem: 10 },
  displayOrder: 35,
  tags: ['basic','bakery','breakfast','delivery','pickup','reservations'],
  icon: 'cake-slice',
  themeColor: '#d97706',
});
