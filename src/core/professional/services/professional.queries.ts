// @ts-nocheck
/**
 * 📦 PROFESSIONAL QUERIES - SSOT v2.0
 *
 * Operações de leitura para profissionais.
 * Todas as queries são pure functions que recebem parâmetros e retornam dados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { applyTerritoryFilter } from "@/core/location";
import { ReviewsService } from "@/core/reviews";
import { PublicIdentityService } from "@/core/public-identity";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import type { TerritoryFilter } from "@/core/location/types";
import type {
  Professional,
  ProfessionalFilters,
  ProfessionalStats,
  ProfessionalReview,
  ProfessionalJob,
} from "../types";

// ============================================================================
// 🔍 PROFESSIONAL QUERIES - Busca de profissionais
// ============================================================================

/**
 * Buscar profissionais com filtros
 */
export async function getProfessionals(
  filters: ProfessionalFilters = {},
): Promise<Professional[]> {
  try {
    let query = (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles:profile_id(id, name, avatar_url, verified),
        addresses:address_id(*)
      `,
      )
      .eq("is_accepting_clients", true);

    // Aplicar filtro territorial
    if (filters.territory) {
      query = applyTerritoryFilter(query, filters.territory);
    }

    // Filtro de categoria
    if (filters.category) {
      query = query.eq("service_category", filters.category);
    }

    // Filtro de busca textual
    if (filters.search) {
      const sanitizedSearch = sanitizeForILike(filters.search);
      query = query.ilike("professional_name", `%${sanitizedSearch}%`);
    }

    // Ordenação
    if (filters.sortBy === "rating") {
      query = query.order("rating", { ascending: false });
    } else if (filters.sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("professional_name", { ascending: true });
    }

    // Paginação
    const limit = filters.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as Professional[];
  } catch (error) {
    logger.error("[professional.queries] Error fetching professionals:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getProfessionals",
      metadata: { filters },
    });
    throw new Error("Erro ao buscar profissionais");
  }
}

/**
 * Buscar profissionais com paginação (para infinite scroll)
 */
export async function getProfessionalsList(params: {
  pageParam?: number;
  category?: string;
  territory?: TerritoryFilter;
  search?: string;
}): Promise<{ professionals: Professional[]; nextPage?: number }> {
  const { pageParam = 0, category, territory, search } = params;
  const limit = PAGINATION.DEFAULT_LIMIT;
  const offset = pageParam * limit;

  try {
    let query = (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles:profile_id(id, name, avatar_url, verified)
      `,
        { count: "exact" },
      )
      .eq("is_accepting_clients", true);

    if (territory) {
      query = applyTerritoryFilter(query, territory);
    }

    if (category) {
      query = query.eq("service_category", category);
    }

    if (search) {
      const sanitizedSearch = sanitizeForILike(search);
      query = query.ilike("professional_name", `%${sanitizedSearch}%`);
    }

    query = query
      .order("rating", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const hasMore = count ? offset + (data?.length || 0) < count : false;

    return {
      professionals: (data || []) as Professional[],
      nextPage: hasMore ? pageParam + 1 : undefined,
    };
  } catch (error) {
    logger.error("[professional.queries] Error fetching professionals list:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getProfessionalsList",
      metadata: { pageParam, category },
    });
    throw new Error("Erro ao carregar profissionais");
  }
}

/**
 * Buscar profissional por ID
 */
export async function getProfessionalById(id: string): Promise<Professional> {
  try {
    const { data, error } = await (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles:profile_id(id, name, avatar_url, verified),
        addresses:address_id(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Profissional não encontrado");
    }

    return data as Professional;
  } catch (error) {
    logger.error("[professional.queries] Error fetching professional by ID:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getProfessionalById",
      metadata: { id },
    });
    throw error;
  }
}

/**
 * Buscar serviços por perfil
 */
export async function getServicesByProfile(profileId: string): Promise<Professional[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        addresses:address_id(*)
      `,
      )
      .eq("profile_id", profileId)
      .eq("is_accepting_clients", true);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as Professional[];
  } catch (error) {
    logger.error("[professional.queries] Error fetching services by profile:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getServicesByProfile",
      metadata: { profileId },
    });
    throw new Error("Erro ao buscar serviços");
  }
}

// ============================================================================
// 📊 STATS QUERIES - Estatísticas
// ============================================================================

/**
 * Obter estatísticas de um profissional
 */
export async function getStats(professionalId: string): Promise<ProfessionalStats> {
  try {
    const { data, error } = await supabase
      .from("professional_stats")
      .select("*")
      .eq("professional_id", professionalId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return {
      total_views: data?.total_views || 0,
      total_contacts: data?.total_contacts || 0,
      total_reviews: data?.total_reviews || 0,
      average_rating: data?.average_rating || 0,
      total_jobs: data?.total_jobs || 0,
    };
  } catch (error) {
    logger.error("[professional.queries] Error fetching stats:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getStats",
      metadata: { professionalId },
    });
    return {
      total_views: 0,
      total_contacts: 0,
      total_reviews: 0,
      average_rating: 0,
      total_jobs: 0,
    };
  }
}

/**
 * Contar total de profissionais
 */
export async function getTotalProfessionalsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("professional_data")
      .select("*", { count: "exact", head: true })
      .eq("is_accepting_clients", true);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    logger.error("[professional.queries] Error counting professionals:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getTotalProfessionalsCount",
    });
    return 0;
  }
}

/**
 * Contar profissionais criados em um período
 */
export async function getProfessionalsCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("professional_data")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("is_accepting_clients", true);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  } catch (error) {
    logger.error("[professional.queries] Error counting professionals in period:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getProfessionalsCreatedInPeriod",
      metadata: { startDate, endDate },
    });
    return 0;
  }
}

// ============================================================================
// ⭐ REVIEWS QUERIES - Avaliações
// ============================================================================

/**
 * Obter avaliações de um profissional
 */
export async function getReviews(professionalId: string): Promise<ProfessionalReview[]> {
  try {
    const reviews = await ReviewsService.getReviewsForTarget(
      professionalId,
      "professional",
    );
    return reviews as ProfessionalReview[];
  } catch (error) {
    logger.error("[professional.queries] Error fetching reviews:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getReviews",
      metadata: { professionalId },
    });
    return [];
  }
}

/**
 * Obter avaliação do usuário atual
 */
export async function getMyReview(
  professionalId: string,
  userId: string,
): Promise<ProfessionalReview | null> {
  try {
    const review = await ReviewsService.getReviewByUser(
      professionalId,
      "professional",
      userId,
    );
    return review as ProfessionalReview | null;
  } catch (error) {
    logger.error("[professional.queries] Error fetching my review:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getMyReview",
      metadata: { professionalId, userId },
    });
    return null;
  }
}

// ============================================================================
// 🛍️ JOBS QUERIES - Serviços/Trabalhos
// ============================================================================

/**
 * Obter serviços de um profissional
 */
export async function getJobs(professionalId: string): Promise<ProfessionalJob[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("professional_jobs")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as ProfessionalJob[];
  } catch (error) {
    logger.error("[professional.queries] Error fetching jobs:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getJobs",
      metadata: { professionalId },
    });
    throw new Error("Erro ao buscar serviços");
  }
}

// ============================================================================
// 🔍 SEARCH QUERIES - Busca avançada
// ============================================================================

/**
 * Buscar profissionais por IDs (para recomendações)
 */
export async function getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
  try {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles:profile_id(id, name, avatar_url, verified)
      `,
      )
      .in("id", ids)
      .eq("is_accepting_clients", true);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as Professional[];
  } catch (error) {
    logger.error("[professional.queries] Error fetching professionals by IDs:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getProfessionalsByIds",
      metadata: { ids },
    });
    return [];
  }
}

/**
 * Buscar profissionais (busca global)
 */
export async function searchProfessionals(
  query: string,
  filters: ProfessionalFilters = {},
): Promise<Professional[]> {
  try {
    const sanitizedQuery = sanitizeForILike(query);

    let dbQuery = (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles:profile_id(id, name, avatar_url, verified)
      `,
      )
      .eq("is_accepting_clients", true);

    // Busca textual em múltiplos campos
    dbQuery = dbQuery.or(
      `professional_name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,service_category.ilike.%${sanitizedQuery}%`,
    );

    if (filters.territory) {
      dbQuery = applyTerritoryFilter(dbQuery, filters.territory);
    }

    if (filters.category) {
      dbQuery = dbQuery.eq("service_category", filters.category);
    }

    const { data, error } = await dbQuery.limit(PAGINATION.DEFAULT_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as Professional[];
  } catch (error) {
    logger.error("[professional.queries] Error searching professionals:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "searchProfessionals",
      metadata: { query, filters },
    });
    return [];
  }
}

// ============================================================================
// 🌐 PUBLIC PROFILE QUERIES - Perfil público
// ============================================================================

/**
 * Busca perfil público de profissional por slug + uf + cidade
 */
export async function getPublicProfileBySlug(
  slug: string,
  uf: string,
  cidade: string,
): Promise<Professional | null> {
  try {
    // Buscar pela identidade pública
    const identity = await PublicIdentityService.resolveIdentity({
      slug,
      uf,
      cidade,
      type: "professional",
    });

    if (!identity?.entity_id) {
      return null;
    }

    return await getProfessionalById(identity.entity_id);
  } catch (error) {
    logger.error("[professional.queries] Error fetching public profile:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getPublicProfileBySlug",
      metadata: { slug, uf, cidade },
    });
    return null;
  }
}
