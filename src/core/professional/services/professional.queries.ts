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
import { mapProfessionalRow, mapProfessionalRows } from "./professional.mappers";
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
/**
 * Buscar profissionais com filtros
 * FASE 1 IA: Usa public_professional_search (view pública segura)
 */
export async function getProfessionals(
  filters: ProfessionalFilters = {},
): Promise<Professional[]> {
  try {
    let query = (supabase as any)
      .from("public_professional_search")
      .select(
        `
        *,
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        addresses:address_id(*),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
      );

    // Aplicar filtro territorial
    if (filters.territoryFilter) {
      query = applyTerritoryFilter(query, filters.territoryFilter);
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
    } else if (filters.sortBy === "created_at") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("professional_name", { ascending: true });
    }

    // Paginação
    const limit = PAGINATION.DEFAULT_LIMIT;
    const offset = 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return mapProfessionalRows(data);
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
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        address:addresses!address_id(id, location_id, postal_code, street, number, complement, latitude, longitude),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
        { count: "exact" },
      )
      .eq("is_accepting_clients", true)
      .eq("visibility", "public_listed");

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
      professionals: mapProfessionalRows(data),
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
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        addresses:address_id(*),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
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

    return mapProfessionalRow(data);
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
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        addresses:address_id(*),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
      )
      .eq("profile_id", profileId)
      .eq("is_accepting_clients", true);

    if (error) {
      throw new Error(error.message);
    }

    return mapProfessionalRows(data);
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
    const { data, error } = await (supabase as any)
      .from("professional_stats")
      .select("*")
      .eq("profile_id", professionalId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return {
      profile_id: data?.profile_id ?? professionalId,
      views_count: data?.views_count || 0,
      contacts_count: data?.contacts_count || 0,
      favorites_count: data?.favorites_count || 0,
      shares_count: data?.shares_count || 0,
      jobs_completed: data?.jobs_completed || 0,
      response_rate: data?.response_rate || 0,
      average_response_time: data?.average_response_time || 0,
      created_at: data?.created_at ?? new Date(0).toISOString(),
      updated_at: data?.updated_at ?? new Date(0).toISOString(),
    };
  } catch (error) {
    logger.error("[professional.queries] Error fetching stats:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getStats",
      metadata: { professionalId },
    });
    return {
      profile_id: professionalId,
      views_count: 0,
      contacts_count: 0,
      favorites_count: 0,
      shares_count: 0,
      jobs_completed: 0,
      response_rate: 0,
      average_response_time: 0,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
  }
}

/**
 * Contar total de profissionais
 */
export async function getTotalProfessionalsCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("professional_data")
      .select("*", { count: "exact", head: true })
      .eq("is_accepting_clients", true)
      .eq("visibility", "public_listed");

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
    const { count, error } = await (supabase as any)
      .from("professional_data")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("is_accepting_clients", true)
      .eq("visibility", "public_listed");

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
    const reviews = await ReviewsService.getReviewsForProfile(
      professionalId,
      "professional",
    );
    return reviews as unknown as ProfessionalReview[];
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
    const review = await ReviewsService.getReviewByReviewer(
      professionalId,
      userId,
      "professional",
    );
    return review as unknown as ProfessionalReview | null;
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
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
      )
      .in("id", ids)
      .eq("is_accepting_clients", true)
      .eq("visibility", "public_listed");

    if (error) {
      throw new Error(error.message);
    }

    return mapProfessionalRows(data);
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
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        address:addresses!address_id(id, location_id, postal_code, street, number, complement, latitude, longitude),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
      )
      .eq("is_accepting_clients", true)
      .eq("visibility", "public_listed");

    // Busca textual em múltiplos campos
    if (sanitizedQuery) {
      dbQuery = dbQuery.or(
        `professional_name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,service_category.ilike.%${sanitizedQuery}%`,
      );
    }

    if (filters.territoryFilter) {
      dbQuery = applyTerritoryFilter(dbQuery, filters.territoryFilter);
    }

    if (filters.category) {
      dbQuery = dbQuery.eq("service_category", filters.category);
    }

    // Ordenação
    dbQuery = dbQuery
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false });

    const { data, error } = await dbQuery.limit(PAGINATION.DEFAULT_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    return mapProfessionalRows(data);
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
    const { data, error } = await (supabase as any)
      .from("professional_data")
      .select(
        `
        *,
        profiles!professional_data_profile_id_fkey(id, name, avatar_url, phone, whatsapp, verified),
        addresses:address_id(*),
        location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
      `,
      )
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProfessionalRow(data) : null;
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

export type ProfessionalPublicProfile = {
  id: string;
  slug: string;
  professional_name: string;
  description: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  is_verified: boolean;
  is_accepting_clients: boolean;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  certifications: string[] | null;
  experience_years: number | null;
  price_range: string | null;
};

export async function getProfessionalPublicProfileBySlug(
  slug: string,
  uf: string,
  cidade: string,
): Promise<ProfessionalPublicProfile | null> {
  const { data, error } = await (supabase as any)
    .from("professional_data")
    .select(
      `
      id, slug, professional_name, description,
      service_category, service_subcategory,
      is_verified, is_accepting_clients,
      certifications, experience_years, price_range, metadata,
      profiles!inner(avatar_url),
      location:locations!professional_data_location_id_fkey(
        name, type, slug,
        parent:locations!locations_parent_id_fkey(name, slug)
      )
    `,
    )
    .eq("slug", slug)
    .in("visibility", ["public_listed", "public_unlisted"])
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const location = data.location as any;
  let city: string | null = null;
  let state: string | null = null;

  if (location) {
    if (location.type === "city") {
      city = location.name;
      state = location.parent?.slug?.toUpperCase() ?? null;
    } else if (location.type === "district") {
      city = location.parent?.name ?? null;
      state = uf.toUpperCase();
    }
  }

  const ufMatch = !state || state.toLowerCase() === uf.toLowerCase();
  const cidadeMatch =
    !city ||
    city.toLowerCase().replace(/\s+/g, "-") === cidade.toLowerCase() ||
    location?.slug === cidade.toLowerCase();

  if (!ufMatch || !cidadeMatch) return null;

  const profiles = data.profiles as any;
  const metadata = (data.metadata as any) ?? {};

  return {
    id: data.id,
    slug: data.slug,
    professional_name: data.professional_name,
    description: data.description,
    service_category: data.service_category,
    service_subcategory: data.service_subcategory,
    is_verified: data.is_verified,
    is_accepting_clients: data.is_accepting_clients,
    city,
    state,
    avatar_url: profiles?.avatar_url ?? null,
    logo_url: metadata?.logo_url ?? null,
    certifications: data.certifications,
    experience_years: data.experience_years,
    price_range: data.price_range,
  };
}

export async function checkProfessionalSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = (supabase as any)
    .from("professional_data")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getProfessionalSimilarSlugs(
  slug: string,
  limit = PAGINATION.DEFAULT_LIMIT,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("professional_data")
    .select("slug")
    .ilike("slug", `${slug}%`)
    .limit(limit);

  if (error) throw error;
  return (data || []).map((row: { slug: string }) => row.slug).filter(Boolean);
}

export async function getProfessionalSlugHistory(
  professionalId: string,
): Promise<
  Array<{
    id: string;
    old_slug: string;
    new_slug: string | null;
    change_reason: string;
    created_at: string;
  }>
> {
  const { data, error } = await (supabase as any)
    .from("professional_slug_history")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function validateAvailableProfessionalSlug(slug: string): Promise<string> {
  const normalizedSlug = PublicIdentityService.normalize(slug, "professional");
  const availability = await PublicIdentityService.checkAvailability({
    identifier: normalizedSlug,
    entityType: "professional",
  });

  if (availability.status !== "available") {
    throw new Error(
      availability.message ||
        `Slug "${normalizedSlug}" nao esta disponivel.` +
          (availability.suggestion ? ` Sugestao: ${availability.suggestion}` : ""),
    );
  }

  return normalizedSlug;
}

export async function generateUniqueProfessionalSlug(name: string): Promise<string> {
  const baseSlug = PublicIdentityService.normalize(name, "professional") || "profissional";
  let candidate = baseSlug;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const availability = await PublicIdentityService.checkAvailability({
      identifier: candidate,
      entityType: "professional",
    });

    if (availability.status === "available") {
      return candidate;
    }

    candidate =
      availability.suggestion && availability.suggestion !== candidate
        ? availability.suggestion
        : `${baseSlug}-${attempt + 1}`;
  }

  throw new Error("Nao foi possivel gerar um slug profissional disponivel.");
}
