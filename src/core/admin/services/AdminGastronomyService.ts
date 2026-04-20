/**
 * AdminGastronomyService - SSOT para gestão administrativa de gastronomia
 * 
 * IMPORTANTE: Este service usa GastronomyService como base (SSOT)
 * e adiciona funcionalidades administrativas específicas.
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

class AdminGastronomyServiceClass {
  /**
   * Busca estatísticas de gastronomia
   */
  async getStats(): Promise<GastronomyStats> {
    try {
      const { data: profiles, error } = await (supabase as unknown as AdminSupabaseClient)
        .from("gastronomy_profiles")
        .select("*");

      if (error) throw error;

      const typedProfiles = (profiles || []) as GastronomyProfile[];

      const stats: GastronomyStats = {
        total: typedProfiles.length,
        active: typedProfiles.filter(p => p.status === 'active').length,
        inactive: typedProfiles.filter(p => p.status !== 'active').length,
        byCategory: {},
        byPriceRange: {},
        withDelivery: typedProfiles.filter(p => p.delivery_enabled).length,
        withMenu: 0,
      };

      // Contar por categoria
      typedProfiles.forEach(p => {
        const category = p.cuisine_type || 'outros';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        const priceRange = p.price_range || 'não informado';
        stats.byPriceRange[priceRange] = (stats.byPriceRange[priceRange] || 0) + 1;
      });

      // Contar quantos têm menu
      const { count } = await supabase
        .from("menus")
        .select("*", { count: "exact", head: true });
      stats.withMenu = count || 0;

      return stats;
    } catch (error) {
      logger.error("Error fetching gastronomy stats:", error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de menus
   */
  async getMenuStats(): Promise<MenuStats> {
    try {
      const [menusResult, itemsResult, categoriesResult] = await Promise.all([
        supabase.from("menus").select("*", { count: "exact", head: true }),
        supabase.from("menu_items").select("price", { count: "exact" }),
        supabase.from("menu_categories").select("*", { count: "exact", head: true }),
      ]);

      const totalMenus = menusResult.count || 0;
      const totalItems = itemsResult.count || 0;
      const totalCategories = categoriesResult.count || 0;

      const avgItemsPerMenu = totalMenus > 0 ? totalItems / totalMenus : 0;
      
      const prices = (itemsResult.data || [])
        .map((i: any) => i.price)
        .filter((p: number) => p > 0);
      const avgPricePerItem = prices.length > 0 
        ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length 
        : 0;

      return {
        totalMenus,
        totalItems,
        totalCategories,
        avgItemsPerMenu,
        avgPricePerItem,
      };
    } catch (error) {
      logger.error("Error fetching menu stats:", error);
      throw error;
    }
  }

  /**
   * Busca todos os perfis gastronômicos com paginação
   */
  async getAllProfiles(params: {
    page?: number;
    limit?: number;
    search?: string;
    cuisineType?: string;
    priceRange?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        cuisineType,
        priceRange,
        isActive,
      } = params;

      let query = supabase
        .from("gastronomy_profiles")
        .select(`
          *,
          business:business_data!inner(
            id,
            name,
            slug,
            logo_url,
            location_id
          )
        `, { count: "exact" });

      // Filtros
      if (search) {
        query = query.or(`business.name.ilike.%${search}%`);
      }
      if (cuisineType) {
        query = query.eq("cuisine_type", cuisineType);
      }
      if (priceRange) {
        query = query.eq("price_range", priceRange);
      }
      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching gastronomy profiles:", error);
      throw error;
    }
  }

  /**
   * Ativa/desativa perfil gastronômico
   */
  async toggleActive(profileId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase as unknown as AdminSupabaseClient)
        .from("gastronomy_profiles")
        .update({ status: isActive ? 'active' : 'inactive' })
        .eq("id", profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error toggling gastronomy profile:", error);
      return false;
    }
  }

  /**
   * Deleta perfil gastronômico
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("gastronomy_profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error deleting gastronomy profile:", error);
      return false;
    }
  }

  /**
   * Busca menus com paginação
   */
  async getAllMenus(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, isActive } = params;

      let query = supabase
        .from("menus")
        .select(`
          *,
          gastronomy_profile:gastronomy_profiles!inner(
            id,
            business_id
          ),
          categories:menu_categories(count)
        `, { count: "exact" });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching menus:", error);
      throw error;
    }
  }

  /**
   * Busca itens de menu com paginação
   */
  async getAllMenuItems(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, categoryId, isAvailable } = params;

      let query = supabase
        .from("menu_items")
        .select(`
          *,
          category:menu_categories!inner(
            id,
            name,
            menu_id
          )
        `, { count: "exact" });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (isAvailable !== undefined) {
        query = query.eq("is_available", isAvailable);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching menu items:", error);
      throw error;
    }
  }

  /**
   * Ativa/desativa item de menu
   */
  async toggleMenuItem(itemId: string, isAvailable: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error toggling menu item:", error);
      return false;
    }
  }

  /**
   * Deleta item de menu
   */
  async deleteMenuItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error deleting menu item:", error);
      return false;
    }
  }
}

export const adminGastronomyService = new AdminGastronomyServiceClass();
