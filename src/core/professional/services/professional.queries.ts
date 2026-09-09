/**
 * PROFESSIONAL QUERIES - SSOT v2.0
 *
 * Operacoes de leitura para profissionais.
 * Todas as queries sao pure functions que recebem parametros e retornam dados.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { applyTerritoryFilter } from "@/core/location";
import { ReviewsService } from "@/core/reviews";
import { PublicIdentityService } from "@/core/public-identity";
import { EntityContactService } from "@/core/contact";
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

interface QueryError {
  message?: string | null;
  code?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  ilike: (column: string, pattern: string) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lte: (column: string, value: string | number) => QueryBuilder<TRow>;
  neq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  range: (from: number, to: number) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfessionalQueriesDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type TerritorialFilterQuery = {
  eq: (column: string, value: string) => unknown;
  in: (column: string, values: string[]) => unknown;
};

type ProfessionalQueryRow = Parameters<typeof mapProfessionalRow>[0];

interface ProfessionalStatsRow {
  profile_id: string | null;
  views_count: number | null;
  contacts_count: number | null;
  favorites_count: number | null;
  shares_count: number | null;
  jobs_completed: number | null;
  response_rate: number | null;
  average_response_time: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProfessionalJobRow {
  id: string;
  professional_id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  duration_hours: number | null;
  images?: string[] | null;
  is_featured?: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

interface ProfessionalPublicProfileRow {
  id: string;
  slug: string;
  professional_name: string;
  description: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  is_verified: boolean;
  is_accepting_clients: boolean;
  certifications: string[] | null;
  experience_years: number | null;
  price_range: string | null;
  metadata: Record<string, unknown> | null;
  profiles?:
    | { avatar_url: string | null }
    | Array<{ avatar_url: string | null }>
    | null;
  location?:
    | {
        name: string | null;
        type: string | null;
        slug: string | null;
        parent?:
          | {
              name: string | null;
              slug: string | null;
            }
          | Array<{
              name: string | null;
              slug: string | null;
            }>
          | null;
      }
    | Array<{
        name: string | null;
        type: string | null;
        slug: string | null;
        parent?:
          | {
              name: string | null;
              slug: string | null;
            }
          | Array<{
              name: string | null;
              slug: string | null;
            }>
          | null;
      }>
    | null;
}

interface ProfessionalSlugRow {
  slug: string | null;
}

interface ProfessionalIdRow {
  id: string;
}

interface ProfessionalSlugHistoryRow {
  id: string;
  old_slug: string;
  new_slug: string | null;
  change_reason: string;
  created_at: string;
}

const professionalQueriesDb = supabase as unknown as ProfessionalQueriesDbClient;

const PROFESSIONAL_READ_SELECT = `
  id,
  profile_id,
  slug,
  professional_name,
  service_category,
  service_subcategory,
  description,
  certifications,
  experience_years,
  education,
  price_range,
  service_areas,
  service_radius_km,
  available_hours,
  availability_notes,
  portfolio_items,
  is_accepting_clients,
  is_verified,
  verified_at,
  rating,
  address_id,
  location_id,
  metadata,
  visibility,
  created_at,
  updated_at,
  profiles!professional_data_profile_id_fkey(id, name, avatar_url, verified),
  address:addresses!address_id(id, location_id, postal_code, street, number, complement, latitude, longitude),
  location:locations!professional_data_location_id_fkey(id, name, full_name, type, slug, geographic_path)
`;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapProfessionalJobRow(row: ProfessionalJobRow): ProfessionalJob {
  return {
    id: row.id,
    profile_id: row.professional_id,
    title: row.title ?? "Servico",
    description: row.description ?? "",
    category: row.category ?? "geral",
    price: row.price ?? undefined,
    duration: row.duration_hours != null ? String(row.duration_hours) : undefined,
    images: Array.isArray(row.images)
      ? row.images.filter((image): image is string => typeof image === "string")
      : [],
    is_featured: Boolean(row.is_featured),
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  };
}

function buildEmptyStats(professionalId: string): ProfessionalStats {
  const zeroDate = new Date(0).toISOString();

  return {
    profile_id: professionalId,
    views_count: 0,
    contacts_count: 0,
    favorites_count: 0,
    shares_count: 0,
    jobs_completed: 0,
    response_rate: 0,
    average_response_time: 0,
    created_at: zeroDate,
    updated_at: zeroDate,
  };
}

export async function getProfessionals(
  filters: ProfessionalFilters = {},
): Promise<Professional[]> {
  try {
    let query = professionalQueriesDb
      .from<ProfessionalQueryRow>("public_professional_search")
      .select(PROFESSIONAL_READ_SELECT);

    if (filters.territoryFilter) {
      query = applyTerritoryFilter(
        query as unknown as TerritorialFilterQuery & QueryBuilder<ProfessionalQueryRow>,
        filters.territoryFilter,
      );
    }

    if (filters.category) {
      query = query.eq("service_category", filters.category);
    }

    if (filters.search) {
      const sanitizedSearch = sanitizeForILike(filters.search);
      query = query.ilike("professional_name", `%${sanitizedSearch}%`);
    }

    if (filters.sortBy === "rating") {
      query = query.order("rating", { ascending: false });
    } else if (filters.sortBy === "created_at") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("professional_name", { ascending: true });
    }

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
    let query = professionalQueriesDb
      .from<ProfessionalQueryRow>("public_professional_search")
      .select(PROFESSIONAL_READ_SELECT, { count: "exact" });

    if (territory) {
      query = applyTerritoryFilter(
        query as unknown as TerritorialFilterQuery & QueryBuilder<ProfessionalQueryRow>,
        territory,
      );
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

export async function getProfessionalById(id: string): Promise<Professional> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalQueryRow>("professional_data")
      .select(PROFESSIONAL_READ_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Profissional nao encontrado");
    }

    const professional = mapProfessionalRow(data);
    const contact = await EntityContactService.getVisibleForEntity(
      "professional",
      professional.professional_data_id,
    );
    return { ...professional, ...contact };
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

export async function getProfessionalDataIdByProfileId(
  profileId: string,
): Promise<string | null> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalIdRow>("professional_data")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      logger.error(
        "[professional.queries] Error fetching professional_data id by profile_id:",
        error,
      );
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    logger.error(
      "[professional.queries] Error in getProfessionalDataIdByProfileId:",
      error,
    );
    return null;
  }
}

export async function getServicesByProfile(profileId: string): Promise<Professional[]> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalQueryRow>("professional_data")
      .select(PROFESSIONAL_READ_SELECT)
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
    throw new Error("Erro ao buscar servicos");
  }
}

export async function getStats(professionalId: string): Promise<ProfessionalStats> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalStatsRow>("professional_stats")
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
    return buildEmptyStats(professionalId);
  }
}

export async function getTotalProfessionalsCount(): Promise<number> {
  try {
    const { count, error } = await professionalQueriesDb
      .from<ProfessionalIdRow>("professional_data")
      .select("id", { count: "exact", head: true })
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

export async function getProfessionalsCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await professionalQueriesDb
      .from<ProfessionalIdRow>("professional_data")
      .select("id", { count: "exact", head: true })
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

export async function getJobs(professionalId: string): Promise<ProfessionalJob[]> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalJobRow>("professional_jobs")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapProfessionalJobRow);
  } catch (error) {
    logger.error("[professional.queries] Error fetching jobs:", error);
    trackError(error as Error, {
      component: "professional.queries",
      action: "getJobs",
      metadata: { professionalId },
    });
    throw new Error("Erro ao buscar servicos");
  }
}

export async function getProfessionalsByIds(ids: string[]): Promise<Professional[]> {
  try {
    if (!ids || ids.length === 0) return [];

    const { data, error } = await professionalQueriesDb
      .from<ProfessionalQueryRow>("public_professional_search")
      .select(PROFESSIONAL_READ_SELECT)
      .in("id", ids)
      .eq("is_accepting_clients", true);

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

export async function searchProfessionals(
  query: string,
  filters: ProfessionalFilters = {},
): Promise<Professional[]> {
  try {
    const sanitizedQuery = sanitizeForILike(query);

    let dbQuery = professionalQueriesDb
      .from<ProfessionalQueryRow>("public_professional_search")
      .select(PROFESSIONAL_READ_SELECT);

    if (sanitizedQuery) {
      dbQuery = dbQuery.or(
        `professional_name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,service_category.ilike.%${sanitizedQuery}%`,
      );
    }

    if (filters.territoryFilter) {
      dbQuery = applyTerritoryFilter(
        dbQuery as unknown as TerritorialFilterQuery & QueryBuilder<ProfessionalQueryRow>,
        filters.territoryFilter,
      );
    }

    if (filters.category) {
      dbQuery = dbQuery.eq("service_category", filters.category);
    }

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

export async function getPublicProfileBySlug(
  slug: string,
  uf: string,
  cidade: string,
): Promise<Professional | null> {
  try {
    const { data, error } = await professionalQueriesDb
      .from<ProfessionalQueryRow>("public_professional_search")
      .select(PROFESSIONAL_READ_SELECT)
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
  const { data, error } = await professionalQueriesDb
    .from<ProfessionalPublicProfileRow>("professional_data")
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

  const location = firstRelation(data.location);
  const parent = firstRelation(location?.parent);
  let city: string | null = null;
  let state: string | null = null;

  if (location) {
    if (location.type === "city") {
      city = location.name;
      state = parent?.slug?.toUpperCase() ?? null;
    } else if (location.type === "district") {
      city = parent?.name ?? null;
      state = uf.toUpperCase();
    }
  }

  const ufMatch = !state || state.toLowerCase() === uf.toLowerCase();
  const cidadeMatch =
    !city ||
    city.toLowerCase().replace(/\s+/g, "-") === cidade.toLowerCase() ||
    location?.slug === cidade.toLowerCase();

  if (!ufMatch || !cidadeMatch) return null;

  const profile = firstRelation(data.profiles);
  const metadata = asRecord(data.metadata);

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
    avatar_url: profile?.avatar_url ?? null,
    logo_url:
      typeof metadata.logo_url === "string" ? metadata.logo_url : null,
    certifications: data.certifications,
    experience_years: data.experience_years,
    price_range: data.price_range,
  };
}

export async function checkProfessionalSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = professionalQueriesDb
    .from<ProfessionalIdRow>("professional_data")
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
  const { data, error } = await professionalQueriesDb
    .from<ProfessionalSlugRow>("professional_data")
    .select("slug")
    .ilike("slug", `${slug}%`)
    .limit(limit);

  if (error) throw error;
  return (data ?? [])
    .map((row) => row.slug)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export async function getProfessionalSlugHistory(
  professionalId: string,
): Promise<ProfessionalSlugHistoryRow[]> {
  const { data, error } = await professionalQueriesDb
    .from<ProfessionalSlugHistoryRow>("professional_slug_history")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
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
