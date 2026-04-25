/**
 * AdminClassifiedsService - Serviço de administração de classificados
 *
 * ✅ SSOT COMPLIANCE: Delega para ClassifiedService (modules/classifieds)
 * Este serviço encapsula operações administrativas de classificados,
 * delegando para o ClassifiedService (SSOT) sempre que possível.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface AdminClassifiedData {
  [key: string]: unknown;
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  location_id?: string | null;
  seller_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
}

export interface ClassifiedsStats {
  total: number;
  active: number;
  inactive: number;
  sold: number;
  pending: number;
  rejected: number;
}

export interface ClassifiedsListResult {
  data: AdminClassifiedData[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ClassifiedCategoryCoverageItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subcategories: number;
  activeSubcategories: number;
  classifieds: number;
  activeClassifieds: number;
  pendingClassifieds: number;
}

export interface ClassifiedCategoryCoverageResult {
  totalCategories: number;
  activeCategories: number;
  totalSubcategories: number;
  activeSubcategories: number;
  unclassifiedAds: number;
  categories: ClassifiedCategoryCoverageItem[];
}

export interface ClassifiedSellerCoverageItem {
  sellerId: string;
  sellerName: string;
  phone: string | null;
  whatsapp: string | null;
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  soldAds: number;
  rejectedAds: number;
  inactiveAds: number;
  lastAdAt: string | null;
}

export interface ClassifiedSellerCoverageResult {
  totalSellers: number;
  sellersWithActiveAds: number;
  sellersWithPendingAds: number;
  sellers: ClassifiedSellerCoverageItem[];
}

export interface ClassifiedUrlHistoryItem {
  id: string;
  changedAt: string;
  changeReason: string;
  oldCanonicalUrl: string;
  oldSlug: string | null;
  classifiedId: string;
  classifiedTitle: string;
  classifiedPublicId: string | null;
  classifiedStatus: string | null;
}

export interface ClassifiedUrlHistoryResult {
  totalEntries: number;
  page: number;
  totalPages: number;
  latestChangeAt: string | null;
  entries: ClassifiedUrlHistoryItem[];
}

export interface ClassifiedPolicySummary {
  totalClassifieds: number;
  missingCategoryId: number;
  missingSubcategoryId: number;
  missingLocationId: number;
  missingPublicId: number;
  missingSlug: number;
  withLegacyCategoryOnly: number;
}

class AdminClassifiedsServiceClass {
  async getTotalClassifiedsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("classifieds")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error("Error fetching total classifieds count:", error);
      throw error;
    }

    return count || 0;
  }

  async getClassifiedsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from("classifieds")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      logger.error("Error fetching classifieds created in period:", error);
      throw error;
    }

    return count || 0;
  }

  async getRecentClassifieds(limit = 10): Promise<AdminClassifiedData[]> {
    const { data, error } = await supabase
      .from("classifieds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error fetching recent classifieds:", error);
      throw error;
    }

    return (data || []) as AdminClassifiedData[];
  }

  async getPendingReportsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("classified_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      logger.error("Error fetching pending classified reports count:", error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Busca estatísticas de classificados
   */
  async getStats(): Promise<ClassifiedsStats> {
    try {
      const { data, error } = await supabase
        .from("classifieds")
        .select("status")
        .not("status", "is", null);

      if (error) {
        logger.error("Error fetching classifieds stats:", error);
        throw error;
      }

      const stats: ClassifiedsStats = {
        total: data?.length || 0,
        active: data?.filter((c: any) => c.status === "active").length || 0,
        inactive: data?.filter((c: any) => c.status === "inactive").length || 0,
        sold: data?.filter((c: any) => c.status === "sold").length || 0,
        pending: data?.filter((c: any) => c.status === "pending").length || 0,
        rejected: data?.filter((c: any) => c.status === "rejected").length || 0,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  async getCategoryCoverage(): Promise<ClassifiedCategoryCoverageResult> {
    try {
      const [{ data: categories, error: categoriesError }, { data: subcategories, error: subcategoriesError }, { data: classifieds, error: classifiedsError }] = await Promise.all([
        supabase
          .from("classified_categories")
          .select("id, name, slug, is_active")
          .order("name", { ascending: true }),
        supabase
          .from("classified_subcategories")
          .select("id, category_id, is_active"),
        supabase
          .from("classifieds")
          .select("id, category_id, status"),
      ]);

      if (categoriesError) throw categoriesError;
      if (subcategoriesError) throw subcategoriesError;
      if (classifiedsError) throw classifiedsError;

      const subcategoryByCategory = new Map<string, { total: number; active: number }>();
      for (const subcategory of subcategories || []) {
        const previous = subcategoryByCategory.get(subcategory.category_id) ?? { total: 0, active: 0 };
        subcategoryByCategory.set(subcategory.category_id, {
          total: previous.total + 1,
          active: previous.active + (subcategory.is_active ? 1 : 0),
        });
      }

      const classifiedsByCategory = new Map<string, { total: number; active: number; pending: number }>();
      let unclassifiedAds = 0;
      for (const classified of classifieds || []) {
        if (!classified.category_id) {
          unclassifiedAds += 1;
          continue;
        }

        const previous = classifiedsByCategory.get(classified.category_id) ?? { total: 0, active: 0, pending: 0 };
        classifiedsByCategory.set(classified.category_id, {
          total: previous.total + 1,
          active: previous.active + (classified.status === "active" ? 1 : 0),
          pending: previous.pending + (classified.status === "pending" ? 1 : 0),
        });
      }

      const categoryCoverage = (categories || []).map((category) => {
        const subcat = subcategoryByCategory.get(category.id) ?? { total: 0, active: 0 };
        const ads = classifiedsByCategory.get(category.id) ?? { total: 0, active: 0, pending: 0 };
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          isActive: category.is_active,
          subcategories: subcat.total,
          activeSubcategories: subcat.active,
          classifieds: ads.total,
          activeClassifieds: ads.active,
          pendingClassifieds: ads.pending,
        } satisfies ClassifiedCategoryCoverageItem;
      });

      return {
        totalCategories: categories?.length || 0,
        activeCategories: categories?.filter((category) => category.is_active).length || 0,
        totalSubcategories: subcategories?.length || 0,
        activeSubcategories: subcategories?.filter((subcategory) => subcategory.is_active).length || 0,
        unclassifiedAds,
        categories: categoryCoverage,
      };
    } catch (error) {
      logger.error("Error in getCategoryCoverage:", error);
      throw error;
    }
  }

  async getSellerCoverage(options?: { limit?: number }): Promise<ClassifiedSellerCoverageResult> {
    try {
      const limit = Math.max(1, Math.min(options?.limit ?? 30, 100));
      const { data: classifiedRows, error: classifiedError } = await supabase
        .from("classifieds")
        .select("seller_id, status, created_at")
        .order("created_at", { ascending: false });

      if (classifiedError) throw classifiedError;

      const sellerMap = new Map<string, Omit<ClassifiedSellerCoverageItem, "sellerName" | "phone" | "whatsapp">>();

      for (const row of classifiedRows || []) {
        const previous = sellerMap.get(row.seller_id) ?? {
          sellerId: row.seller_id,
          totalAds: 0,
          activeAds: 0,
          pendingAds: 0,
          soldAds: 0,
          rejectedAds: 0,
          inactiveAds: 0,
          lastAdAt: null,
        };

        sellerMap.set(row.seller_id, {
          ...previous,
          totalAds: previous.totalAds + 1,
          activeAds: previous.activeAds + (row.status === "active" ? 1 : 0),
          pendingAds: previous.pendingAds + (row.status === "pending" ? 1 : 0),
          soldAds: previous.soldAds + (row.status === "sold" ? 1 : 0),
          rejectedAds: previous.rejectedAds + (row.status === "rejected" ? 1 : 0),
          inactiveAds: previous.inactiveAds + (row.status === "inactive" ? 1 : 0),
          lastAdAt: previous.lastAdAt && previous.lastAdAt > row.created_at ? previous.lastAdAt : row.created_at,
        });
      }

      const sellerIds = Array.from(sellerMap.keys());
      let profileMap = new Map<string, { name: string | null; phone: string | null; whatsapp: string | null }>();

      if (sellerIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, phone, whatsapp")
          .in("id", sellerIds);

        if (profileError) throw profileError;

        profileMap = new Map(
          (profileRows || []).map((profile) => [
            profile.id,
            {
              name: profile.name ?? null,
              phone: profile.phone ?? null,
              whatsapp: profile.whatsapp ?? null,
            },
          ]),
        );
      }

      const sellers = Array.from(sellerMap.values())
        .sort((a, b) => b.totalAds - a.totalAds || (b.lastAdAt || "").localeCompare(a.lastAdAt || ""))
        .slice(0, limit)
        .map((seller) => {
          const profile = profileMap.get(seller.sellerId);
          return {
            ...seller,
            sellerName: profile?.name || "Sem nome",
            phone: profile?.phone ?? null,
            whatsapp: profile?.whatsapp ?? null,
          } satisfies ClassifiedSellerCoverageItem;
        });

      return {
        totalSellers: sellerMap.size,
        sellersWithActiveAds: Array.from(sellerMap.values()).filter((seller) => seller.activeAds > 0).length,
        sellersWithPendingAds: Array.from(sellerMap.values()).filter((seller) => seller.pendingAds > 0).length,
        sellers,
      };
    } catch (error) {
      logger.error("Error in getSellerCoverage:", error);
      throw error;
    }
  }

  async getUrlHistory(options?: { page?: number; limit?: number }): Promise<ClassifiedUrlHistoryResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("classified_url_history")
        .select(
          `
          id,
          changed_at,
          change_reason,
          old_canonical_url,
          old_slug,
          classified_id,
          classifieds(
            title,
            public_id,
            status
          )
        `,
          { count: "exact" },
        )
        .order("changed_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const entries: ClassifiedUrlHistoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        changedAt: row.changed_at,
        changeReason: row.change_reason,
        oldCanonicalUrl: row.old_canonical_url,
        oldSlug: row.old_slug,
        classifiedId: row.classified_id,
        classifiedTitle: row.classifieds?.title || "Classificado removido",
        classifiedPublicId: row.classifieds?.public_id ?? null,
        classifiedStatus: row.classifieds?.status ?? null,
      }));

      return {
        totalEntries: count || 0,
        page,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
        latestChangeAt: entries[0]?.changedAt || null,
        entries,
      };
    } catch (error) {
      logger.error("Error in getUrlHistory:", error);
      throw error;
    }
  }

  async getPolicySummary(): Promise<ClassifiedPolicySummary> {
    try {
      const { data, error } = await supabase
        .from("classifieds")
        .select("id, category, category_id, subcategory_id, location_id, public_id, slug");

      if (error) throw error;

      const rows = data || [];
      return {
        totalClassifieds: rows.length,
        missingCategoryId: rows.filter((row) => !row.category_id).length,
        missingSubcategoryId: rows.filter((row) => !row.subcategory_id).length,
        missingLocationId: rows.filter((row) => !row.location_id).length,
        missingPublicId: rows.filter((row) => !row.public_id).length,
        missingSlug: rows.filter((row) => !row.slug).length,
        withLegacyCategoryOnly: rows.filter((row) => Boolean(row.category) && !row.category_id).length,
      };
    } catch (error) {
      logger.error("Error in getPolicySummary:", error);
      throw error;
    }
  }

  /**
   * Busca todos os classificados com paginação
   * ✅ SSOT: Delega para ClassifiedsFacade.queries.getAllClassifieds
   */
  async getAllClassifieds(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
  }): Promise<ClassifiedsListResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("classifieds")
        .select(
          `
          *,
          seller:profiles!seller_id (
            id,
            name,
            avatar_url,
            phone,
            whatsapp
          ),
          locations(name, slug),
          classified_categories(slug, name),
          classified_subcategories(slug, name)
          `,
          { count: "exact" }
        );

      // Aplica filtro de status se fornecido
      if (options.status) {
        query = query.eq("status", options.status);
      }

      // Aplica busca se fornecida
      if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
      }

      if (options.categoryId) {
        query = query.eq("category_id", options.categoryId);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error fetching classifieds:", error);
        throw error;
      }

      const classifieds: AdminClassifiedData[] = (data || []).map((item: any) => ({
        ...item,
        seller_name: item.seller?.name,
        seller_avatar: item.seller?.avatar_url,
        seller_phone: item.seller?.phone,
        seller_whatsapp: item.seller?.whatsapp,
        category_slug: item.classified_categories?.slug,
        subcategory_slug: item.classified_subcategories?.slug,
      }));

      return {
        data: classifieds,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllClassifieds:", error);
      throw error;
    }
  }

  /**
   * Busca um classificado por ID
   * ✅ SSOT: Delega para ClassifiedsFacade.queries.getClassifiedById
   */
  async getClassifiedById(id: string): Promise<AdminClassifiedData | null> {
    try {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching classified by id:", error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return data as AdminClassifiedData;
    } catch (error) {
      logger.error("Error in getClassifiedById:", error);
      throw error;
    }
  }

  /**
   * Atualiza um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.updateClassified
   */
  async updateClassified(
    id: string,
    updates: Partial<AdminClassifiedData>,
  ): Promise<AdminClassifiedData | null> {
    try {
      // Para admin, precisamos do seller_id para atualizar
      // Busca o classificado primeiro para obter seller_id
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      // Remove status from updates if present (use specific methods for status changes)
      const { status, ...safeUpdates } = updates;

      const { data, error } = await supabase
        .from("classifieds")
        .update(safeUpdates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        logger.error("Error updating classified:", error);
        throw error;
      }
      
      return data as AdminClassifiedData;
    } catch (error) {
      logger.error("Error in updateClassified:", error);
      throw error;
    }
  }

  /**
   * Deleta um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.deleteClassified
   */
  async deleteClassified(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      const { error } = await supabase
        .from("classifieds")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in deleteClassified:", error);
      throw error;
    }
  }

  /**
   * Aprova um classificado (muda status para active)
   */
  async approveClassified(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classifieds")
        .update({ status: "active" })
        .eq("id", id);

      if (error) {
        logger.error("Error approving classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in approveClassified:", error);
      throw error;
    }
  }

  /**
   * Rejeita um classificado (muda status para rejected)
   */
  async rejectClassified(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classifieds")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) {
        logger.error("Error rejecting classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in rejectClassified:", error);
      throw error;
    }
  }

  /**
   * Marca um classificado como vendido
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.markAsSold
   */
  async markAsSold(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      const { error } = await supabase
        .from("classifieds")
        .update({ status: "sold" })
        .eq("id", id);

      if (error) {
        logger.error("Error marking classified as sold:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in markAsSold:", error);
      throw error;
    }
  }

  /**
   * Reativa um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.reactivateClassified
   */
  async reactivateClassified(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      const { error } = await supabase
        .from("classifieds")
        .update({ status: "active" })
        .eq("id", id);

      if (error) {
        logger.error("Error reactivating classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in reactivateClassified:", error);
      throw error;
    }
  }

  /**
   * Toggle active status (para quick actions)
   */
  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const status = isActive ? "active" : "inactive";
      const { error } = await supabase
        .from("classifieds")
        .update({ status })
        .eq("id", id);

      if (error) {
        logger.error("Error toggling classified active status:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in toggleActive:", error);
      throw error;
    }
  }
}

export const adminClassifiedsService = new AdminClassifiedsServiceClass();

