// @ts-nocheck
/**
 * 🍽️ MENU QUERIES - SSOT Read Model para Cardápios
 *
 * Todas as operações de leitura para menus, categorias e itens.
 *
 * @version 2.0.0 - Extraído de MenuQueryService
 */

import { supabase } from '@/integrations/supabase';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';
import { logger } from '@/shared/utils/logger';
import { sanitizeForILike } from '@/shared/utils/sqlSanitization';
import {
  isValidId,
  sanitizeSearchQuery,
} from '@/shared/validation';
import {
  getGastronomyBusiness,
  getGastronomyBusinesses,
} from './gastronomy.queries';
import type { GastronomyBusinessFilters } from '../types';
import type {
  Menu,
  MenuCategory,
  MenuItem,
  MenuItemWithRelations,
  MenuWithCategories,
  MenuItemVariant,
  MenuItemAddon,
  MenuPromotion,
  MenuItemFilters,
  PublicGastronomyFoodItem,
  GastronomyBusiness,
} from '../types';

// ============================================================
// HELPERS INTERNOS
// ============================================================

const DEV_MOCK_ID_PREFIX = 'mock-';

function isDevMockId(value?: string | null): boolean {
  return typeof value === 'string' && value.startsWith(DEV_MOCK_ID_PREFIX);
}

/**
 * Mapeia item para formato público de catálogo
 */
function mapToPublicFoodItem(params: {
  item: MenuItem;
  category: MenuCategory;
  menu: Menu;
  business: GastronomyBusiness;
}): PublicGastronomyFoodItem {
  const { item, category, menu, business } = params;
  const metadata = item.metadata || {};
  
  // Validar coordenadas antes de usar (evitar null/NaN no MapLibre)
  const businessLatitude =
    typeof business.address?.latitude === 'number' &&
    !isNaN(business.address.latitude) &&
    isFinite(business.address.latitude)
      ? business.address.latitude
      : undefined;
      
  const businessLongitude =
    typeof business.address?.longitude === 'number' &&
    !isNaN(business.address.longitude) &&
    isFinite(business.address.longitude)
      ? business.address.longitude
      : undefined;

  return {
    id: item.id,
    business_data_id: business.business_data_id,
    business_profile_id: business.profile_id,
    menu_id: menu.id,
    category_id: category.id,
    name: item.name,
    description: item.description || undefined,
    price: item.base_price,
    original_price:
      typeof metadata.original_price === 'number' ? metadata.original_price : undefined,
    image_url: item.image_url || undefined,
    category: category.name,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    business_name: business.name,
    business_slug: business.slug,
    business_cuisine: business.gastronomy_profile.cuisine_type,
    business_rating: business.rating,
    business_neighborhood: business.location?.name || '',
    business_geographic_path: business.geographic_path || '',
    business_latitude: businessLatitude,
    business_longitude: businessLongitude,
    business_is_open:
      OpeningHoursService.calculateStatus(
        business.horario_funcionamento,
      ).is_open,
    business_delivery_enabled: business.gastronomy_profile.delivery_enabled,
    business_takeout_enabled: business.gastronomy_profile.takeout_enabled,
    business_delivery_time_min: business.gastronomy_profile.delivery_time_min,
    business_delivery_time_max: business.gastronomy_profile.delivery_time_max,
    business_delivery_fee: business.gastronomy_profile.delivery_fee,
    is_featured: item.is_featured,
    is_promotion: Boolean(metadata.is_promotion),
    is_vegetarian: item.is_vegetarian,
    is_vegan: item.is_vegan,
    is_spicy: item.is_spicy,
    is_gluten_free: item.is_gluten_free,
    orders_count:
      typeof metadata.orders_count === 'number' ? metadata.orders_count : 0,
  };
}

// ============================================================
// QUERIES - MENUS
// ============================================================

/**
 * Buscar menu por ID
 */
export async function getMenu(menuId: string): Promise<Menu | null> {
  try {
    if (!isValidId(menuId) || isDevMockId(menuId)) {
      logger.warn('[MenuQueries] Invalid menu ID provided:', menuId);
      return null;
    }

    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', menuId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      logger.error('[MenuQueries] Error fetching menu:', error);
      return null;
    }

    return data as Menu | null;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return null;
  }
}

/**
 * Buscar menus de um negócio
 */
export async function getMenusByBusiness(businessId: string): Promise<Menu[]> {
  try {
    if (!isValidId(businessId) || isDevMockId(businessId)) {
      logger.warn('[MenuQueries] Invalid business ID provided:', businessId);
      return [];
    }

    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('[MenuQueries] Error fetching menus:', error);
      return [];
    }

    return (data || []) as Menu[];
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

/**
 * Buscar menu completo com categorias e itens
 */
export async function getMenuWithCategories(menuId: string): Promise<MenuWithCategories | null> {
  try {
    // 1. Buscar menu
    const menu = await getMenu(menuId);
    if (!menu) return null;

    // 2. Buscar categorias
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (catError) {
      logger.error('[MenuQueries] Error fetching categories:', catError);
      return null;
    }

    // 3. Buscar itens de cada categoria
    const categoriesWithItems = await Promise.all(
      (categories || []).map(async (category) => {
        const items = await getMenuItemsByCategory(category.id);
        return {
          ...category,
          items,
        };
      }),
    );

    return {
      ...menu,
      categories: categoriesWithItems,
    } as MenuWithCategories;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return null;
  }
}

// ============================================================
// QUERIES - CATEGORIAS
// ============================================================

/**
 * Buscar categorias de um menu
 */
export async function getMenuCategories(menuId: string): Promise<MenuCategory[]> {
  try {
    if (!menuId || isDevMockId(menuId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('[MenuQueries] Error fetching categories:', error);
      return [];
    }

    return (data || []) as MenuCategory[];
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

/**
 * Buscar categoria por ID
 */
export async function getMenuCategory(categoryId: string): Promise<MenuCategory | null> {
  try {
    if (!isValidId(categoryId) || isDevMockId(categoryId)) {
      return null;
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', categoryId)
      .eq('is_available', true)
      .maybeSingle();

    if (error) {
      logger.error('[MenuQueries] Error fetching category:', error);
      return null;
    }

    return data as MenuCategory | null;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return null;
  }
}

// ============================================================
// QUERIES - ITENS
// ============================================================

/**
 * Buscar itens de uma categoria
 */
export async function getMenuItemsByCategory(
  categoryId: string,
  filters?: MenuItemFilters,
): Promise<MenuItemWithRelations[]> {
  try {
    if (!categoryId || isDevMockId(categoryId)) {
      return [];
    }

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true);

    // Aplicar filtros
    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters?.is_vegetarian !== undefined) {
      query = query.eq('is_vegetarian', filters.is_vegetarian);
    }

    if (filters?.is_vegan !== undefined) {
      query = query.eq('is_vegan', filters.is_vegan);
    }

    if (filters?.is_gluten_free !== undefined) {
      query = query.eq('is_gluten_free', filters.is_gluten_free);
    }

    if (filters?.is_lactose_free !== undefined) {
      query = query.eq('is_lactose_free', filters.is_lactose_free);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      logger.error('[MenuQueries] Error fetching items:', error);
      return [];
    }

    // Carregar relações para cada item
    const itemsWithRelations = await Promise.all(
      (data || []).map(async (item) => {
        const [variants, addons] = await Promise.all([
          getMenuItemVariants(item.id),
          getMenuItemAddons(item.id),
        ]);

        return {
          ...item,
          variants,
          addons,
        } as MenuItemWithRelations;
      }),
    );

    return itemsWithRelations;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

/**
 * Buscar item por ID
 */
export async function getMenuItem(itemId: string): Promise<MenuItemWithRelations | null> {
  try {
    if (!isValidId(itemId) || isDevMockId(itemId)) {
      return null;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', itemId)
      .eq('is_available', true)
      .maybeSingle();

    if (error || !data) {
      logger.error('[MenuQueries] Error fetching item:', error);
      return null;
    }

    const [variants, addons] = await Promise.all([
      getMenuItemVariants(itemId),
      getMenuItemAddons(itemId),
    ]);

    return {
      ...data,
      variants,
      addons,
    } as MenuItemWithRelations;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return null;
  }
}

/**
 * Buscar itens em destaque de um negócio
 */
export async function getFeaturedMenuItems(businessId: string): Promise<MenuItemWithRelations[]> {
  try {
    if (!isValidId(businessId)) {
      return [];
    }

    // Buscar menus do negócio
    const menus = await getMenusByBusiness(businessId);
    if (!menus.length) return [];

    const menuIds = menus.map((m) => m.id);

    // Buscar itens em destaque
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .in('menu_id', menuIds)
      .eq('is_available', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(10);

    if (error) {
      logger.error('[MenuQueries] Error fetching featured items:', error);
      return [];
    }

    // Carregar relações
    const itemsWithRelations = await Promise.all(
      (data || []).map(async (item) => {
        const [variants, addons] = await Promise.all([
          getMenuItemVariants(item.id),
          getMenuItemAddons(item.id),
        ]);

        return {
          ...item,
          variants,
          addons,
        } as MenuItemWithRelations;
      }),
    );

    return itemsWithRelations;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

// ============================================================
// QUERIES - VARIANTES E ADICIONAIS
// ============================================================

/**
 * Buscar variantes de um item
 */
export async function getMenuItemVariants(itemId: string): Promise<MenuItemVariant[]> {
  try {
    if (!isValidId(itemId) || isDevMockId(itemId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('menu_item_variants')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('[MenuQueries] Error fetching variants:', error);
      return [];
    }

    return (data || []) as MenuItemVariant[];
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

/**
 * Buscar adicionais de um item
 */
export async function getMenuItemAddons(itemId: string): Promise<MenuItemAddon[]> {
  try {
    if (!isValidId(itemId) || isDevMockId(itemId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('menu_item_addons')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('[MenuQueries] Error fetching addons:', error);
      return [];
    }

    return (data || []) as MenuItemAddon[];
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

// ============================================================
// QUERIES - PROMOÇÕES
// ============================================================

/**
 * Buscar promoções ativas de um menu
 */
export async function getActiveMenuPromotions(menuId: string): Promise<MenuPromotion[]> {
  try {
    if (!isValidId(menuId)) {
      return [];
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('menu_promotions')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[MenuQueries] Error fetching promotions:', error);
      return [];
    }

    return (data || []) as MenuPromotion[];
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error:', error);
    return [];
  }
}

// ============================================================
// QUERIES - CATÁLOGO PÚBLICO
// ============================================================

/**
 * Buscar catálogo completo de um negócio para exibição pública
 */
export async function getPublicMenuCatalog(businessId: string): Promise<{
  business: GastronomyBusiness | null;
  menu: MenuWithCategories | null;
}> {
  try {
    const business = await getGastronomyBusiness(businessId);
    if (!business) {
      return { business: null, menu: null };
    }

    const menus = await getMenusByBusiness(businessId);
    if (!menus.length) {
      return { business, menu: null };
    }

    // Pegar o primeiro menu ativo (ou o principal)
    const mainMenu = menus[0];
    const menuWithCategories = await getMenuWithCategories(mainMenu.id);

    return {
      business,
      menu: menuWithCategories,
    };
  } catch (error) {
    logger.error('[MenuQueries] Error fetching public catalog:', error);
    return { business: null, menu: null };
  }
}

/**
 * Buscar catálogo de comida por território com filtros
 */
export async function getPublicFoodCatalog(params: {
  territoryFilter: import('@/core/location/types').TerritoryFilter;
  searchQuery?: string;
  cuisineType?: string;
  deliveryEnabled?: boolean;
  isOpenNow?: boolean;
  sortBy?: string;
}): Promise<PublicGastronomyFoodItem[]> {
  try {
    // Buscar negócios gastronômicos por território
    const filters: GastronomyBusinessFilters = {
      territoryFilter: params.territoryFilter,
      cuisine_type: params.cuisineType,
      delivery_enabled: params.deliveryEnabled,
      is_open_now: params.isOpenNow,
      search: params.searchQuery,
    };

    const businesses = await getGastronomyBusinesses(filters);

    const operationalBusinesses = businesses.filter(
      (business) => !!business.business_data_id && !!business.slug && !!business.geographic_path,
    );

    if (!operationalBusinesses.length) {
      return [];
    }

    const businessIds = operationalBusinesses.map(
      (business) => business.business_data_id,
    );
    const businessMap = new Map(
      operationalBusinesses.map((business) => [business.business_data_id, business]),
    );

    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select('*')
      .in('business_id', businessIds)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (menusError) {
      logger.error('[MenuQueries] Error fetching public menus:', menusError);
      return [];
    }

    if (!menus?.length) {
      return [];
    }

    const menuIds = menus.map((menu) => menu.id);
    const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .in('menu_id', menuIds)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      logger.error('[MenuQueries] Error fetching public categories:', categoriesError);
      return [];
    }

    if (!categories?.length) {
      return [];
    }

    const categoryIds = categories.map((category) => category.id);
    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    let itemsQuery = supabase
      .from('menu_items')
      .select('*')
      .in('category_id', categoryIds)
      .eq('is_available', true);

    if (params.searchQuery) {
      const sanitizedSearch = sanitizeForILike(params.searchQuery);
      if (sanitizedSearch) {
        itemsQuery = itemsQuery.or(
          `name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`,
        );
      }
    }

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      logger.error('[MenuQueries] Error fetching public food items:', itemsError);
      return [];
    }

    const publicItems = (items as MenuItem[] || [])
      .map((item) => {
        const category = categoryMap.get(item.category_id);
        if (!category) return null;

        const menu = menuMap.get(category.menu_id);
        if (!menu) return null;

        const business = businessMap.get(menu.business_id);
        if (!business) return null;

        return mapToPublicFoodItem({
          item,
          category,
          menu,
          business,
        });
      })
      .filter((item): item is PublicGastronomyFoodItem => item !== null);

    // Aplicar ordenação
    switch (params.sortBy) {
      case 'price_asc':
        publicItems.sort((left, right) => left.price - right.price);
        break;
      case 'price_desc':
        publicItems.sort((left, right) => right.price - left.price);
        break;
      case 'rating':
        publicItems.sort((left, right) => right.business_rating - left.business_rating);
        break;
      case 'delivery_time':
        publicItems.sort(
          (left, right) =>
            (left.business_delivery_time_min ?? 999) -
            (right.business_delivery_time_min ?? 999),
        );
        break;
      case 'most_ordered':
      default:
        publicItems.sort((left, right) => right.orders_count - left.orders_count);
        break;
    }

    return publicItems;
  } catch (error) {
    logger.error('[MenuQueries] Unexpected error fetching public food catalog:', error);
    return [];
  }
}

/**
 * Buscar itens para catálogo público (formato simplificado)
 */
export async function getPublicFoodItems(params: {
  businessId: string;
  categoryId?: string;
  featuredOnly?: boolean;
}): Promise<PublicGastronomyFoodItem[]> {
  try {
    const { businessId, categoryId, featuredOnly } = params;

    const business = await getGastronomyBusiness(businessId);
    if (!business) {
      return [];
    }

    let items: MenuItemWithRelations[] = [];

    if (categoryId) {
      items = await getMenuItemsByCategory(categoryId);
    } else if (featuredOnly) {
      items = await getFeaturedMenuItems(businessId);
    } else {
      // Buscar todos os itens do negócio
      const menus = await getMenusByBusiness(businessId);
      const menuIds = menus.map((m) => m.id);
      
      if (!menuIds.length) return [];

      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .in('menu_id', menuIds)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (data) {
        items = await Promise.all(
          data.map(async (item) => {
            const [variants, addons] = await Promise.all([
              getMenuItemVariants(item.id),
              getMenuItemAddons(item.id),
            ]);
            return { ...item, variants, addons } as MenuItemWithRelations;
          }),
        );
      }
    }

    // Mapear para formato público usando batch queries
    const categoryIds = items.map((item) => item.category_id);
    const menuIds = [...new Set(items.map((item) => item.menu_id || '').filter(Boolean))];

    const [categoriesData, menusData] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('*')
        .in('id', categoryIds),
      supabase
        .from('menus')
        .select('*')
        .in('id', menuIds),
    ]);

    const categoryMap = new Map(
      (categoriesData.data || []).map((c) => [c.id, c as MenuCategory]),
    );
    const menuMap = new Map(
      (menusData.data || []).map((m) => [m.id, m as Menu]),
    );

    const result: PublicGastronomyFoodItem[] = items
      .map((item) => {
        const category = categoryMap.get(item.category_id);
        if (!category) return null;

        const menu = menuMap.get(item.menu_id || '');
        if (!menu) return null;

        return mapToPublicFoodItem({ item, category, menu, business });
      })
      .filter((item): item is PublicGastronomyFoodItem => item !== null);

    return result;
  } catch (error) {
    logger.error('[MenuQueries] Error fetching public items:', error);
    return [];
  }
}
