/**
 * 🍽️ BASE NICHE PRESET
 *
 * Configuração base para todos os nichos gastronômicos.
 * Define valores padrão e estrutura mínima.
 *
 * @version 1.0.0
 */

import type {
  GastronomyNicheConfig,
  NicheDefaultConfig,
  NicheValidationRules,
} from '@/core/business/niches/types';

export const baseDefaultConfig: NicheDefaultConfig = {
  defaultMinimumOrder: 0,
  defaultDeliveryFee: 0,
  defaultDeliveryTimeMin: 30,
  defaultDeliveryTimeMax: 60,
  defaultAcceptsReservations: false,
  defaultPaymentMethods: ['cash', 'credit_card', 'debit_card', 'pix'],
};

export const baseValidationRules: NicheValidationRules = {
  minPrice: 0.01,
  maxPrice: 10000,
  maxVariantsPerItem: 10,
  maxAddonsPerItem: 20,
  requiresDescription: false,
  requiresPhoto: false,
};

export const baseAdminSections = [
  'basic_menu','variants','addons','combos','promotions','delivery_areas',
  'operational_hours','order_management','analytics',
] as const;

export const baseCapabilities = [
  'basic_menu','menu_variants','menu_addons','menu_combos','menu_promotions',
  'delivery','pickup','dine_in','payment_cash','payment_card','payment_pix',
  'order_management','custom_instructions','dietary_flags','photos',
] as const;

export function createNichePreset(
  overrides: Partial<GastronomyNicheConfig> & { nicheKey: string; publicLabel: string },
): GastronomyNicheConfig {
  return {
    description: '',
    operationalType: 'fast_food',
    supportLevel: 'basic_enabled',
    isSelectable: true,
    isPublic: true,
    isBeta: false,
    enabledCapabilities: [...baseCapabilities],
    missingCapabilities: [],
    defaultConfig: { ...baseDefaultConfig },
    adminSections: [...baseAdminSections],
    validationRules: { ...baseValidationRules },
    displayOrder: 100,
    tags: [],
    icon: 'utensils',
    themeColor: '#f97316',
    ...overrides,
  };
}
