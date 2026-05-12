/**
 * AdminGastronomyService - SSOT de governanca administrativa de gastronomia
 *
 * Ownership:
 * - Catalogo/menu (profiles, menus, categories, items): admin gastronomia
 * - Promocoes/cupons: ownership funcional em admin promocoes/cupons, com
 *   leitura consolidada aqui para fronteira de governanca do vertical.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient, GastronomyProfile } from "../types/adminDatabase.types";

export interface GastronomyStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  byPriceRange: Record<string, number>;
  withDelivery: number;
  withMenu: number;
}

export interface MenuStats {
  totalMenus: number;
  totalItems: number;
  totalCategories: number;
  avgItemsPerMenu: number;
  avgPricePerItem: number;
}

export interface AdminGastronomyMenuRecord {
  id: string;
  business_id: string;
  name: string;
  is_active: boolean;
  categoryCount: number;
  itemCount: number;
  businessName: string | null;
}

export interface AdminGastronomyItemRecord {
  id: string;
  name: string;
  categoryName: string | null;
  menuName: string | null;
  businessName: string | null;
  basePrice: number;
  is_available: boolean;
  image_url: string | null;
}

export interface GastronomyIntegritySummary {
  profilesWithoutMenus: number;
  menusWithoutCategories: number;
  categoriesWithoutItems: number;
  itemsWithoutPrice: number;
  itemsWithoutImage: number;
  inactiveProfilesWithActiveMenus: number;
}

export interface GastronomyPromotionOwnershipSummary {
  gastronomyBusinesses: number;
  promotionsTotal: number;
  promotionsActive: number;
  couponsTotal: number;
  couponsActive: number;
  menuPromotionsTotal: number;
  menuPromotionsActive: number;
}

export interface BusinessWithNiche {
  id: string;
  name: string;
  slug: string;
  nicheKey: string | null;
  cuisineType: string | null;
  status: string;
  createdAt: string;
}

export interface PizzaCatalogSummary {
  businessId: string;
  businessName: string;
  config: {
    defaultPriceRule: string;
    allowHalfHalf: boolean;
    allowThreeFlavors: boolean;
    allowFourFlavors: boolean;
  };
  sizesCount: number;
  flavorsCount: number;
  edgesCount: number;
  doughsCount: number;
}

type NicheBusinessRow = {
  business_id: string;
  niche_key: string | null;
  cuisine_type: string | null;
  status: string;
  created_at: string;
  business?: {
    name?: string | null;
    slug?: string | null;
  } | null;
};

class AdminGastronomyServiceClass {
  async getStats(): Promise<GastronomyStats> {
    try {
      const { data: profiles, error } = await (supabase as unknown as AdminSupabaseClient)
        .from("gastronomy_profiles")
        .select("*");

      if (error) throw error;

      const typedProfiles = (profiles || []) as GastronomyProfile[];
      const businessIds = typedProfiles.map((profile) => profile.business_id);
      const categoryCounts = new Map<string, number>();
      const priceRangeCounts = new Map<string, number>();

      const stats: GastronomyStats = {
        total: typedProfiles.length,
        active: typedProfiles.filter((profile) => profile.status === "active").length,
        inactive: typedProfiles.filter((profile) => profile.status !== "active").length,
        byCategory: {},
        byPriceRange: {},
        withDelivery: typedProfiles.filter((profile) => profile.delivery_enabled).length,
        withMenu: 0,
      };

      typedProfiles.forEach((profile) => {
        const category = profile.cuisine_type || "outros";
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

        const priceRange = profile.price_range || "nao informado";
        priceRangeCounts.set(priceRange, (priceRangeCounts.get(priceRange) || 0) + 1);
      });

      stats.byCategory = Object.fromEntries(categoryCounts.entries());
      stats.byPriceRange = Object.fromEntries(priceRangeCounts.entries());

      if (businessIds.length > 0) {
        const { count } = await supabase
          .from("menus")
          .select("id", { count: "exact", head: true })
          .in("business_id", businessIds);
        stats.withMenu = count || 0;
      }

      return stats;
    } catch (error) {
      logger.error("AdminGastronomyService.getStats", error);
      throw error;
    }
  }

  async getMenuStats(): Promise<MenuStats> {
    try {
      const [menusResult, categoriesResult, itemsResult] = await Promise.all([
        supabase.from("menus").select("id", { count: "exact", head: true }),
        supabase.from("menu_categories").select("id", { count: "exact", head: true }),
        supabase.from("menu_items").select("base_price"),
      ]);

      const totalMenus = menusResult.count || 0;
      const totalCategories = categoriesResult.count || 0;
      const totalItems = itemsResult.data?.length || 0;

      const prices = (itemsResult.data || [])
        .map((item: { base_price: number | null }) => item.base_price || 0)
        .filter((price) => price > 0);

      return {
        totalMenus,
        totalItems,
        totalCategories,
        avgItemsPerMenu: totalMenus > 0 ? totalItems / totalMenus : 0,
        avgPricePerItem:
          prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getMenuStats", error);
      throw error;
    }
  }

  async getAllProfiles(params: {
    page?: number;
    limit?: number;
    search?: string;
    cuisineType?: string;
    priceRange?: string;
    isActive?: boolean;
  } = {}) {
    const { page = 1, limit = 20, search, cuisineType, priceRange, isActive } = params;

    try {
      let query = supabase
        .from("gastronomy_profiles")
        .select(
          `
          *,
          business:business_data!inner(
            id,
            name,
            slug,
            logo_url,
            category
          )
        `,
          { count: "exact" },
        );

      if (search) {
        query = query.ilike("business.name", `%${search}%`);
      }
      if (cuisineType) {
        query = query.eq("cuisine_type", cuisineType);
      }
      if (priceRange) {
        query = query.eq("price_range", priceRange);
      }
      if (isActive !== undefined) {
        query = query.eq("status", isActive ? "active" : "inactive");
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getAllProfiles", error);
      throw error;
    }
  }

  async toggleActive(profileId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as AdminSupabaseClient)
        .from("gastronomy_profiles")
        .update({ status: isActive ? "active" : "inactive" })
        .eq("id", profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminGastronomyService.toggleActive", error);
      return false;
    }
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gastronomy_profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminGastronomyService.deleteProfile", error);
      return false;
    }
  }

  async getAllMenus(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  } = {}) {
    const { page = 1, limit = 20, search, isActive } = params;

    try {
      let query = supabase.from("menus").select("*", { count: "exact" });

      if (search) query = query.ilike("name", `%${search}%`);
      if (isActive !== undefined) query = query.eq("is_active", isActive);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data: menus, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!menus || menus.length === 0) {
        return { data: [], count: count || 0, page, limit, totalPages: 0 };
      }

      const menuIds = menus.map((menu) => menu.id);
      const businessIds = [...new Set(menus.map((menu) => menu.business_id))];

      const [categoriesRes, businessesRes] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("id, menu_id")
          .in("menu_id", menuIds),
        supabase
          .from("business_data")
          .select("id, name")
          .in("id", businessIds),
      ]);

      const categories = categoriesRes.data || [];
      const categoriesByMenu = new Map<string, number>();
      categories.forEach((category) => {
        categoriesByMenu.set(category.menu_id, (categoriesByMenu.get(category.menu_id) || 0) + 1);
      });

      // Query items using category ids only when available.
      const categoryIds = categories.map((category) => category.id);
      let itemRows: Array<{ id: string; category_id: string }> = [];
      if (categoryIds.length > 0) {
        const menuItemsRes = await supabase
          .from("menu_items")
          .select("id, category_id")
          .in("category_id", categoryIds);
        itemRows = menuItemsRes.data || [];
      }

      const menuByCategory = new Map<string, string>();
      categories.forEach((category) => menuByCategory.set(category.id, category.menu_id));

      const itemsByMenu = new Map<string, number>();
      itemRows.forEach((item) => {
        const menuId = menuByCategory.get(item.category_id);
        if (!menuId) return;
        itemsByMenu.set(menuId, (itemsByMenu.get(menuId) || 0) + 1);
      });

      const businessNameById = new Map(
        (businessesRes.data || []).map((business) => [business.id, business.name]),
      );

      const enrichedMenus: AdminGastronomyMenuRecord[] = menus.map((menu) => ({
        id: menu.id,
        business_id: menu.business_id,
        name: menu.name,
        is_active: menu.is_active,
        categoryCount: categoriesByMenu.get(menu.id) || 0,
        itemCount: itemsByMenu.get(menu.id) || 0,
        businessName: businessNameById.get(menu.business_id) || null,
      }));

      return {
        data: enrichedMenus,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getAllMenus", error);
      throw error;
    }
  }

  async getAllMenuItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
  } = {}) {
    const { page = 1, limit = 20, search, categoryId, isAvailable } = params;

    try {
      let query = supabase
        .from("menu_items")
        .select("id, name, category_id, base_price, is_available, image_url", { count: "exact" });

      if (search) query = query.ilike("name", `%${search}%`);
      if (categoryId) query = query.eq("category_id", categoryId);
      if (isAvailable !== undefined) query = query.eq("is_available", isAvailable);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data: items, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!items || items.length === 0) {
        return { data: [], count: count || 0, page, limit, totalPages: 0 };
      }

      const categoryIds = [...new Set(items.map((item) => item.category_id))];
      const categoriesRes = await supabase
        .from("menu_categories")
        .select("id, name, menu_id")
        .in("id", categoryIds);
      const categories = categoriesRes.data || [];
      const categoryById = new Map(
        categories.map((category) => [category.id, { name: category.name, menu_id: category.menu_id }]),
      );

      const menuIds = [...new Set(categories.map((category) => category.menu_id))];
      const menusRes = await supabase
        .from("menus")
        .select("id, name, business_id")
        .in("id", menuIds);
      const menus = menusRes.data || [];
      const menuById = new Map(
        menus.map((menu) => [menu.id, { name: menu.name, business_id: menu.business_id }]),
      );

      const businessIds = [...new Set(menus.map((menu) => menu.business_id))];
      const businessesRes = await supabase
        .from("business_data")
        .select("id, name")
        .in("id", businessIds);
      const businessById = new Map(
        (businessesRes.data || []).map((business) => [business.id, business.name]),
      );

      const enrichedItems: AdminGastronomyItemRecord[] = items.map((item) => {
        const category = categoryById.get(item.category_id);
        const menu = category ? menuById.get(category.menu_id) : null;
        const businessName = menu ? businessById.get(menu.business_id) || null : null;

        return {
          id: item.id,
          name: item.name,
          categoryName: category?.name || null,
          menuName: menu?.name || null,
          businessName,
          basePrice: item.base_price,
          is_available: item.is_available,
          image_url: item.image_url,
        };
      });

      return {
        data: enrichedItems,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getAllMenuItems", error);
      throw error;
    }
  }

  async toggleMenuItem(itemId: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminGastronomyService.toggleMenuItem", error);
      return false;
    }
  }

  async toggleMenu(menuId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("menus")
        .update({ is_active: isActive })
        .eq("id", menuId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminGastronomyService.toggleMenu", error);
      return false;
    }
  }

  async getIntegritySummary(): Promise<GastronomyIntegritySummary> {
    try {
      const [profilesRes, menusRes, categoriesRes, itemsRes] = await Promise.all([
        supabase.from("gastronomy_profiles").select("id, business_id, status"),
        supabase.from("menus").select("id, business_id, is_active"),
        supabase.from("menu_categories").select("id, menu_id"),
        supabase.from("menu_items").select("id, category_id, base_price, image_url"),
      ]);

      const profiles = profilesRes.data || [];
      const menus = menusRes.data || [];
      const categories = categoriesRes.data || [];
      const items = itemsRes.data || [];

      const menusByBusinessId = new Map<string, number>();
      menus.forEach((menu) => {
        menusByBusinessId.set(menu.business_id, (menusByBusinessId.get(menu.business_id) || 0) + 1);
      });

      const categoriesByMenuId = new Map<string, string[]>();
      categories.forEach((category) => {
        const bucket = categoriesByMenuId.get(category.menu_id) || [];
        bucket.push(category.id);
        categoriesByMenuId.set(category.menu_id, bucket);
      });

      const itemsByCategoryId = new Map<string, number>();
      items.forEach((item) => {
        itemsByCategoryId.set(item.category_id, (itemsByCategoryId.get(item.category_id) || 0) + 1);
      });

      const profilesWithoutMenus = profiles.filter(
        (profile) => !menusByBusinessId.has(profile.business_id),
      ).length;

      const menusWithoutCategories = menus.filter(
        (menu) => (categoriesByMenuId.get(menu.id)?.length || 0) === 0,
      ).length;

      const categoriesWithoutItems = categories.filter(
        (category) => (itemsByCategoryId.get(category.id) || 0) === 0,
      ).length;

      const itemsWithoutPrice = items.filter((item) => !item.base_price || item.base_price <= 0).length;
      const itemsWithoutImage = items.filter((item) => !item.image_url).length;

      const activeMenuBusinessIds = new Set(
        menus.filter((menu) => menu.is_active).map((menu) => menu.business_id),
      );

      const inactiveProfilesWithActiveMenus = profiles.filter(
        (profile) => profile.status !== "active" && activeMenuBusinessIds.has(profile.business_id),
      ).length;

      return {
        profilesWithoutMenus,
        menusWithoutCategories,
        categoriesWithoutItems,
        itemsWithoutPrice,
        itemsWithoutImage,
        inactiveProfilesWithActiveMenus,
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getIntegritySummary", error);
      throw error;
    }
  }

  async getPromotionOwnershipSummary(): Promise<GastronomyPromotionOwnershipSummary> {
    try {
      const profilesRes = await supabase
        .from("gastronomy_profiles")
        .select("business_id");

      const businessIds = [...new Set((profilesRes.data || []).map((row) => row.business_id))];

      if (businessIds.length === 0) {
        return {
          gastronomyBusinesses: 0,
          promotionsTotal: 0,
          promotionsActive: 0,
          couponsTotal: 0,
          couponsActive: 0,
          menuPromotionsTotal: 0,
          menuPromotionsActive: 0,
        };
      }

      const [promotionsRes, couponsRes, menuPromotionsRes] = await Promise.all([
        supabase
          .from("promotions")
          .select("id, business_id, is_active, expires_at")
          .in("business_id", businessIds),
        supabase
          .from("coupons")
          .select("id, business_id, is_active, validade")
          .in("business_id", businessIds),
        supabase
          .from("menu_promotions")
          .select("id, business_id, is_active")
          .in("business_id", businessIds),
      ]);

      const nowIso = new Date().toISOString();
      const promotions = promotionsRes.data || [];
      const coupons = couponsRes.data || [];
      const menuPromotions = menuPromotionsRes.data || [];

      const promotionsActive = promotions.filter(
        (promotion) =>
          promotion.is_active && (!promotion.expires_at || promotion.expires_at > nowIso),
      ).length;

      const couponsActive = coupons.filter(
        (coupon) => coupon.is_active && (!coupon.validade || coupon.validade > nowIso),
      ).length;

      const menuPromotionsActive = menuPromotions.filter((promotion) => promotion.is_active).length;

      return {
        gastronomyBusinesses: businessIds.length,
        promotionsTotal: promotions.length,
        promotionsActive,
        couponsTotal: coupons.length,
        couponsActive,
        menuPromotionsTotal: menuPromotions.length,
        menuPromotionsActive,
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getPromotionOwnershipSummary", error);
      throw error;
    }
  }

  /**
   * Busca empresas gastronomicas com nicho especifico (ex: 'pizza')
   */
  async getBusinessesByNiche(nicheKey: string, params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ data: BusinessWithNiche[]; count: number; totalPages: number }> {
    const { page = 1, limit = 20, search } = params;

    try {
      let query = supabase
        .from("gastronomy_profiles")
        .select(
          `
          business_id,
          niche_key,
          cuisine_type,
          status,
          created_at,
          business:business_data!inner(
            id,
            name,
            slug
          )
        `,
          { count: "exact" },
        )
        .eq("niche_key", nicheKey);

      if (search) {
        query = query.ilike("business.name", `%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const businesses: BusinessWithNiche[] = ((data as NicheBusinessRow[] | null) || []).map((row) => ({
        id: row.business_id,
        name: row.business?.name || "",
        slug: row.business?.slug || "",
        nicheKey: row.niche_key,
        cuisineType: row.cuisine_type,
        status: row.status,
        createdAt: row.created_at,
      }));

      return {
        data: businesses,
        count: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getBusinessesByNiche", error);
      throw error;
    }
  }

  /**
   * Obtem resumo do catalogo de pizzaria para visualizacao admin
   */
  async getPizzaCatalogSummary(businessId: string): Promise<PizzaCatalogSummary | null> {
    try {
      // Buscar dados em paralelo
      const [configRes, sizesRes, flavorsRes, edgesRes, doughsRes, businessRes] = await Promise.all([
        supabase.from("pizza_niche_configs").select("*").eq("business_id", businessId).single(),
        supabase.from("pizza_sizes").select("id").eq("business_id", businessId),
        supabase.from("pizza_flavors").select("id").eq("business_id", businessId),
        supabase.from("pizza_edges").select("id").eq("business_id", businessId),
        supabase.from("pizza_doughs").select("id").eq("business_id", businessId),
        supabase.from("business_data").select("name").eq("id", businessId).single(),
      ]);

      if (configRes.error) {
        // Config nao encontrada = nao eh pizzaria ou nao configurada
        return null;
      }

      const config = configRes.data;

      return {
        businessId,
        businessName: businessRes.data?.name || "",
        config: {
          defaultPriceRule: config.default_price_rule,
          allowHalfHalf: config.allow_half_half,
          allowThreeFlavors: config.allow_three_flavors,
          allowFourFlavors: config.allow_four_flavors,
        },
        sizesCount: sizesRes.data?.length || 0,
        flavorsCount: flavorsRes.data?.length || 0,
        edgesCount: edgesRes.data?.length || 0,
        doughsCount: doughsRes.data?.length || 0,
      };
    } catch (error) {
      logger.error("AdminGastronomyService.getPizzaCatalogSummary", error);
      throw error;
    }
  }
}

export const adminGastronomyService = new AdminGastronomyServiceClass();
