/**
 * 🍕 PIZZA NICHE PRESET
 *
 * Configuração para pizzarias - nicho complexo a ser implementado.
 * Este arquivo define a estrutura completa que será desenvolvida na próxima etapa.
 *
 * @version 2.0.0 - Full Enabled
 * @status full_enabled
 */

import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

/**
 * Capacidades específicas de pizza (para implementação futura)
 */
const pizzaCapabilities = [
  'pizza_sizes',
  'pizza_flavors',
  'pizza_half_half',
  'pizza_multi_flavor',
  'pizza_crusts',
  'pizza_crust_stuffing',
  'pizza_edge_rules',
] as const;

/**
 * Seções de admin específicas de pizza (para implementação futura)
 */
const pizzaAdminSections = [
  'pizza_sizes',
  'pizza_flavors',
  'pizza_crusts',
  'pizza_pricing',
] as const;

/**
 * Configuração de pizza - nicho completo
 */
export const pizzaNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'pizza',
  publicLabel: 'Pizzaria',
  description: 'Pizzarias com suporte a múltiplos sabores, meio a meio, bordas recheadas e regras de preço específicas.',
  operationalType: 'complex',
  supportLevel: 'full_enabled',
  isSelectable: true,
  isPublic: true,
  isBeta: false,

  // Capacidades atuais (básicas)
  enabledCapabilities: [
    'basic_menu',
    'menu_variants',      // Tamanhos: Broto, Média, Grande, Família
    'menu_addons',        // Bordas: Catupiry, Cheddar, Chocolate
    'menu_combos',        // Combo Pizza + Refrigerante
    'menu_promotions',
    ...pizzaCapabilities,
    'delivery',
    'pickup',
    'dine_in',
    'table_reservation',  // Pizzarias geralmente aceitam reservas
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
    defaultDeliveryTimeMin: 35,
    defaultDeliveryTimeMax: 60,
    defaultAcceptsReservations: true,
    defaultPaymentMethods: ['cash', 'credit_card', 'debit_card', 'pix', 'online'],
    suggestedCategories: [
      'Pizzas Tradicionais',
      'Pizzas Especiais',
      'Pizzas Doces',
      'Bebidas',
      'Sobremesas',
    ],
    suggestedItems: [
      'Pizza Margherita',
      'Pizza Calabresa',
      'Pizza Portuguesa',
      'Pizza Quatro Queijos',
      'Pizza de Chocolate',
    ],
    // Configurações específicas de pizza (para uso futuro)
    nicheSpecific: {
      maxFlavorsPerPizza: 4,
      defaultCrustTypes: ['tradicional', 'fina', 'pan', 'integral'],
      defaultSizes: [
        { key: 'broto', name: 'Broto', slices: 4, diameter: 20 },
        { key: 'media', name: 'Média', slices: 6, diameter: 30 },
        { key: 'grande', name: 'Grande', slices: 8, diameter: 35 },
        { key: 'familia', name: 'Família', slices: 12, diameter: 45 },
      ],
      crustStuffingOptions: [
        { key: 'catupiry', name: 'Catupiry', priceAdjustment: 8 },
        { key: 'cheddar', name: 'Cheddar', priceAdjustment: 8 },
        { key: 'chocolate', name: 'Chocolate', priceAdjustment: 10 },
        { key: 'doce_leite', name: 'Doce de Leite', priceAdjustment: 10 },
      ],
    },
  },

  // Seções básicas + específicas (específicas serão ignoradas até implementadas)
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
    // Seções específicas de pizza (para implementação futura)
    ...pizzaAdminSections,
  ],

  validationRules: {
    minPrice: 20,
    maxPrice: 500,
    maxVariantsPerItem: 4,    // Máximo 4 tamanhos por sabor
    maxAddonsPerItem: 10,     // Máximo 10 adicionais (bordas, extras)
    requiresDescription: false,
    requiresPhoto: true,      // Fotos são importantes para pizzas
  },

  displayOrder: 1, // Primeiro na lista quando implementado
  tags: ['complex', 'delivery', 'reservations', 'multi-flavor', 'family'],
  icon: 'pizza',
  themeColor: '#ef4444', // red-500
});

/**
 * Nota de implementação futura:
 *
 * Quando implementar o nicho Pizza completamente:
 *
 * 1. Criar tabelas específicas:
 *    - pizza_sizes (tamanhos com fatias e diâmetro)
 *    - pizza_flavors (sabores com categorias)
 *    - pizza_crusts (tipos de massa)
 *    - pizza_crust_stuffing (bordas recheadas)
 *    - pizza_price_rules (regras de preço)
 *
 * 2. Criar componentes específicos:
 *    - PizzaSizeSelector
 *    - PizzaFlavorSelector (com suporte a meio a meio)
 *    - PizzaCrustSelector
 *    - PizzaBuilder (monte sua pizza)
 *
 * 3. Regras de negócio:
 *    - Meio a meio: preço = média dos dois sabores + custo da borda
 *    - 3 sabores: preço do mais caro + custo da borda
 *    - 4 sabores: preço do mais caro + custo da borda + 10%
 *
 * 4. Mudar supportLevel para 'full_enabled' e isSelectable para true
 */
