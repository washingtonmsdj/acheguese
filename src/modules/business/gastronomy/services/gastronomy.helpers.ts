/**
 * 🍽️ GASTRONOMY HELPERS - Pure Functions
 *
 * Funções utilitárias puras para gastronomia.
 * Sem side effects, sem acesso a banco de dados.
 *
 */

import type {
  GastronomyBusiness,
  GastronomyProfile,
  MenuItem,
  MenuItemWithRelations,
  MenuCategory,
  Menu,
} from '../types';
import { formatBrl } from '../utils/currency';

// ============================================================
// VALIDAÇÕES
// ============================================================

/**
 * Verifica se um negócio gastronômico está aberto
 */
export function isGastronomyBusinessOpen(business: GastronomyBusiness): boolean {
  if (!business.horario_funcionamento) {
    return false;
  }

  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = Object.entries(business.horario_funcionamento).find(
    ([day]) => day === String(dayOfWeek),
  )?.[1];

  if (!hours || hours.closed) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Verifica se negócio faz delivery no momento
 */
export function isDeliveryAvailable(business: GastronomyBusiness): boolean {
  return business.gastronomy_profile?.delivery_enabled === true && isGastronomyBusinessOpen(business);
}

/**
 * Verifica se negócio faz retirada no momento
 */
export function isTakeoutAvailable(business: GastronomyBusiness): boolean {
  return business.gastronomy_profile?.takeout_enabled === true && isGastronomyBusinessOpen(business);
}

/**
 * Verifica se negócio aceita reservas
 */
export function acceptsReservations(business: GastronomyBusiness): boolean {
  return business.gastronomy_profile?.accepts_reservations === true;
}

// ============================================================
// CÁLCULOS
// ============================================================

/**
 * Calcula preço final de um item considerando variantes e adicionais
 */
export function calculateItemPrice(params: {
  basePrice: number;
  selectedVariants?: Array<{ price_adjustment: number }>;
  selectedAddons?: Array<{ price: number }>;
  quantity?: number;
}): number {
  const { basePrice, selectedVariants = [], selectedAddons = [], quantity = 1 } = params;

  const variantsTotal = selectedVariants.reduce((sum, v) => sum + (v.price_adjustment || 0), 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const unitPrice = basePrice + variantsTotal + addonsTotal;

  return unitPrice * quantity;
}

/**
 * Calcula taxa de entrega com base na distância
 */
export function calculateDeliveryFee(params: {
  distanceKm: number;
  baseFee: number;
  perKmRate: number;
  maxFee: number;
  minFee: number;
}): number {
  const { distanceKm, baseFee, perKmRate, maxFee, minFee } = params;
  const calculatedFee = baseFee + distanceKm * perKmRate;
  return Math.max(minFee, Math.min(calculatedFee, maxFee));
}

/**
 * Calcula tempo estimado de entrega
 */
export function calculateEstimatedDeliveryTime(params: {
  preparationTimeMin: number;
  preparationTimeMax: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}): { min: number; max: number } {
  const { preparationTimeMin, preparationTimeMax, deliveryTimeMin, deliveryTimeMax } = params;

  return {
    min: preparationTimeMin + deliveryTimeMin,
    max: preparationTimeMax + deliveryTimeMax,
  };
}

/**
 * Calcula valor mínimo de pedido considerando taxa de entrega
 */
export function calculateMinimumOrderValue(params: {
  subtotal: number;
  minimumOrder: number;
  deliveryFee: number;
}): { 
  meetsMinimum: boolean;
  remainingToMinimum: number;
  totalWithFee: number;
} {
  const { subtotal, minimumOrder, deliveryFee } = params;
  const totalWithFee = subtotal + deliveryFee;
  const meetsMinimum = subtotal >= minimumOrder;
  const remainingToMinimum = Math.max(0, minimumOrder - subtotal);

  return {
    meetsMinimum,
    remainingToMinimum,
    totalWithFee,
  };
}

// ============================================================
// FORMATAÇÃO
// ============================================================

/**
 * Formata tempo de entrega para exibição
 */
export function formatDeliveryTime(minMinutes: number, maxMinutes: number): string {
  if (minMinutes === maxMinutes) {
    return `${minMinutes} min`;
  }
  return `${minMinutes}-${maxMinutes} min`;
}

/**
 * Formata taxa de entrega para exibição
 */
export function formatDeliveryFee(fee: number | undefined): string {
  if (fee === undefined || fee === null) {
    return 'Grátis';
  }
  if (fee === 0) {
    return 'Grátis';
  }
  return formatBrl(fee);
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number): string {
  return formatBrl(price);
}

/**
 * Formata tipo de cozinha para exibição amigável
 */
export function formatCuisineType(cuisineType: string): string {
  const cuisineMap: Record<string, string> = {
    brazilian: 'Brasileira',
    italian: 'Italiana',
    japanese: 'Japonesa',
    mexican: 'Mexicana',
    chinese: 'Chinesa',
    indian: 'Indiana',
    arabic: 'Árabe',
    french: 'Francesa',
    american: 'Americana',
    vegan: 'Vegana',
    vegetarian: 'Vegetariana',
    seafood: 'Frutos do Mar',
    steakhouse: 'Churrascaria',
    pizza: 'Pizzaria',
    burger: 'Hamburgueria',
    bakery: 'Padaria',
    cafe: 'Cafeteria',
    dessert: 'Sobremesas',
    healthy: 'Saudável',
    fast_food: 'Fast Food',
    gourmet: 'Gourmet',
  };

  return cuisineMap[cuisineType.toLowerCase()] || cuisineType;
}

/**
 * Formata faixa de preço para exibição
 */
export function formatPriceRange(priceRange: string): string {
  const rangeMap: Record<string, string> = {
    $: '$',
    $$: '$$',
    $$$: '$$$',
    $$$$: '$$$$',
    cheap: '$',
    moderate: '$$',
    expensive: '$$$',
    very_expensive: '$$$$',
  };

  return rangeMap[priceRange.toLowerCase()] || priceRange;
}

// ============================================================
// FILTROS E BUSCA
// ============================================================

/**
 * Filtra itens por categoria de dieta
 */
export function filterItemsByDiet(
  items: MenuItem[],
  diet: 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_free',
): MenuItem[] {
  switch (diet) {
    case "vegetarian":
      return items.filter((item) => item.is_vegetarian);
    case "vegan":
      return items.filter((item) => item.is_vegan);
    case "gluten_free":
      return items.filter((item) => item.is_gluten_free);
    case "lactose_free":
      return items.filter((item) => item.is_lactose_free);
    default:
      return items;
  }
}

/**
 * Filtra itens em destaque
 */
export function filterFeaturedItems(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => item.is_featured);
}

/**
 * Busca itens por texto
 */
export function searchItems(items: MenuItemWithRelations[], query: string): MenuItemWithRelations[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = item.description?.toLowerCase().includes(normalizedQuery);
    const ingredientsMatch = item.ingredients?.some(
      (i) => i.toLowerCase().includes(normalizedQuery),
    );
    const variantMatch = item.variants?.some((v) =>
      v.name.toLowerCase().includes(normalizedQuery),
    );

    return nameMatch || descriptionMatch || ingredientsMatch || variantMatch;
  });
}

// ============================================================
// ORDENAÇÃO
// ============================================================

/**
 * Ordena itens por ordem de exibição
 */
export function sortItemsByDisplayOrder<T extends { display_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/**
 * Ordena categorias por ordem de exibição
 */
export function sortCategoriesByDisplayOrder<T extends { display_order?: number }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/**
 * Ordena negócios por avaliação
 */
export function sortBusinessesByRating<T extends { rating?: number }>(businesses: T[]): T[] {
  return [...businesses].sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

/**
 * Ordena negócios por proximidade (simulada)
 */
export function sortBusinessesByDistance<T extends { distance?: number }>(businesses: T[]): T[] {
  return [...businesses].sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

// ============================================================
// VALIDAÇÕES DE PEDIDO
// ============================================================

/**
 * Valida se um pedido pode ser feito no horário atual
 */
export function validateOrderTime(business: GastronomyBusiness): {
  valid: boolean;
  reason?: string;
} {
  if (!isGastronomyBusinessOpen(business)) {
    return { valid: false, reason: 'O estabelecimento está fechado no momento' };
  }

  return { valid: true };
}

/**
 * Valida se valor mínimo de pedido foi atingido
 */
export function validateMinimumOrder(params: {
  subtotal: number;
  minimumOrder: number;
}): { valid: boolean; remaining: number } {
  const { subtotal, minimumOrder } = params;
  const remaining = Math.max(0, minimumOrder - subtotal);

  return {
    valid: remaining === 0,
    remaining,
  };
}

/**
 * Valida se item está disponível para pedido
 */
export function validateItemAvailability(item: MenuItem): { valid: boolean; reason?: string } {
  if (!item.is_available) {
    return { valid: false, reason: 'Item indisponível no momento' };
  }

  return { valid: true };
}
