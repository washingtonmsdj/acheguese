/**
 * 🔍 BUSINESS QUERIES — Leitura de dados
 *
 * Responsabilidade única: todas as operações de consulta (SELECT)
 * - Sem escritas (INSERT/UPDATE/DELETE)
 * - Sem lógica de negócio complexa
 * - Mapeamento de dados via business.mappers
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { applyTerritoryFilter } from "@/core/location/utils";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";

const supabaseTyped = supabase as unknown as AdminSupabaseClient;
const supabaseAny = supabase as any;
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import {
  isValidBusinessId,
  isValidPageParam,
  isValidPageSize,
  sanitizeSearchQuery,
  isValidSlug,
} from "./validators";
import {
  mapBusinessDataToBusiness,
  mapProductRecordToProduct,
} from "./business.mappers";
import type {
  Business,
  BusinessFilters,
  BusinessDataWithProfiles,
  Product,
  ProductRecord,
} from "../types";
import type { TerritoryFilter } from "@/core/location/types";

/**
 * Buscar empresas (com filtros)
 * ETAPA 9: Carrega relações canônicas quando disponíveis
 */
export async function getBusinesses(
  filters: BusinessFilters = {},
): Promise<Business[]> {
  try {
    // Check if table exists first
    const { error: checkError } = await supabaseTyped.from("business_data")
      .select("profile_id")
      .limit(1);

    if (checkError) {
      logger.warn(
        "⚠️ business_data table not accessible, returning empty array:",
        (checkError as { message?: string }).message,
      );
      return [];
    }

    let query = supabaseTyped.from("business_data")
      .select(`
        *,
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .eq("status", "active")
      .in("business_role", ["standalone", "branch"]);

    // Aplicar filtros
    if (filters.category && filters.category !== "todos") {
      query = (query as unknown as { eq: (field: string, value: string) => typeof query }).eq("category", filters.category);
    }

    if (filters.search) {
      const sanitizedSearch = sanitizeForILike(filters.search);
      if (sanitizedSearch) {
        query = (query as unknown as { or: (condition: string) => typeof query }).or(
          `business_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`,
        );
      }
    }

    if (filters.neighborhood) {
      query = (query as unknown as { eq: (field: string, value: string) => typeof query }).eq(
        "metadata->>neighborhood",
        filters.neighborhood,
      );
    }

    if (filters.hasDelivery) {
      query = (query as unknown as { eq: (field: string, value: string) => typeof query }).eq(
        "metadata->>tem_delivery",
        "true",
      );
    }

    // SSOT - Filtro territorial usando utilitário compartilhado
    if (filters.territoryFilter) {
      query = applyTerritoryFilter(
        query as unknown as {
          eq: (field: string, value: string) => unknown;
          in: (field: string, values: string[]) => unknown;
        },
        filters.territoryFilter,
      ) as typeof query;
    }

    // Ordenação
    switch (filters.sortBy) {
      case "rating":
        query = (query as unknown as { order: (field: string, opts: { ascending: boolean }) => typeof query }).order(
          "rating",
          { ascending: false },
        );
        break;
      case "recommendations_count":
        query = (query as unknown as { order: (field: string, opts: { ascending: boolean }) => typeof query }).order(
          "recommendations_count",
          { ascending: false },
        );
        query = (query as unknown as { order: (field: string, opts: { ascending: boolean }) => typeof query }).order(
          "rating",
          { ascending: false },
        );
        break;
      case "name":
        query = (query as unknown as { order: (field: string, opts: { ascending: boolean }) => typeof query }).order(
          "business_name",
          { ascending: true },
        );
        break;
      default:
        query = (query as unknown as { order: (field: string, opts: { ascending: boolean }) => typeof query }).order(
          "created_at",
          { ascending: false },
        );
    }

    const { data, error } = await query;

    if (error) {
      logger.warn("⚠️ Error fetching businesses:", (error as { message?: string }).message);
      return [];
    }

    // Fetch profiles separately to avoid join issues
    const profileIds =
      ((data as Array<{ profile_id: string }>) || [])
        .map((d) => d.profile_id)
        .filter(Boolean) || [];
    const profilesMap = new Map<
      string,
      { id: string; name: string; phone?: string; whatsapp?: string }
    >();

    if (profileIds.length > 0) {
      // Importação dinâmica para evitar circular dependency
      const profilesData = await profileService.getProfilesByIds(profileIds);
      profilesData.forEach((p: { id: string; name: string; phone?: string; whatsapp?: string }) =>
        profilesMap.set(p.id, p),
      );
    }

    const businesses = ((data as BusinessDataWithProfiles[]) || []).map((d) =>
      mapBusinessDataToBusiness({
        ...d,
        profiles: profilesMap.get(d.profile_id) || {
          id: d.profile_id,
          name: (d as unknown as { business_name?: string }).business_name || "Empresa",
        },
      } as BusinessDataWithProfiles),
    );

    return businesses;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("⚠️ Unexpected error in getBusinesses:", message);
    return [];
  }
}

/**
 * Buscar empresas com paginação (para infinite scroll)
 * FASE 1 IA: Usa public_business_search (view pública segura)
 */
export async function getBusinessesList(params: {
  pageParam?: number;
  category?: string;
  searchQuery?: string;
  sortBy?: BusinessFilters["sortBy"];
  pageSize?: number;
  filter?: TerritoryFilter;
} = {}): Promise<{ businesses: Business[]; nextPage?: number }> {
  const {
    pageParam = 0,
    category,
    searchQuery,
    sortBy,
    pageSize = 12,
    filter,
  } = params;

  // Validação
  if (!isValidPageParam(pageParam)) {
    logger.warn("Invalid pageParam provided to getBusinessesList", { pageParam });
    return { businesses: [], nextPage: undefined };
  }

  if (!isValidPageSize(pageSize)) {
    logger.warn("Invalid pageSize provided to getBusinessesList", { pageSize });
    return { businesses: [], nextPage: undefined };
  }

  try {
    // FASE 1 IA: Usar view pública segura
    const checkResult = await supabaseTyped.from("public_business_search")
      .select("profile_id")
      .limit(1);

    if (checkResult.error) {
      logger.warn("⚠️ public_business_search view not accessible:", checkResult.error.message);
      return { businesses: [], nextPage: undefined };
    }

    let query = supabaseTyped.from("public_business_search")
      .select(`
        *,
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .in("business_role", ["standalone", "branch"])
      .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

    // Aplicar filtros
    if (category && category !== "todos") {
      query = (query as unknown as { eq: (field: string, value: string) => typeof query }).eq("category", category);
    }

    if (searchQuery?.trim()) {
      const sanitized = sanitizeSearchQuery(searchQuery);
      if (sanitized) {
        const safeQuery = sanitizeForILike(sanitized);
        if (safeQuery) {
          query = (query as unknown as { or: (condition: string) => typeof query }).or(
            `business_name.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%,metadata->>neighborhood.ilike.%${safeQuery}%`,
          );
        }
      }
    }

    // Hierárquico - resolve descendentes
    let resolvedFilter = filter;
    if (filter?.scope === "location") {
      const { data: descendantIds, error: rpcError } = await supabase.rpc(
        "rpc_get_location_descendants_ids",
        { p_location_id: filter.location_id },
      );

      if (!rpcError && descendantIds && descendantIds.length > 0) {
        resolvedFilter = { scope: "group", location_ids: descendantIds };
      }
    }

    if (resolvedFilter) {
      query = applyTerritoryFilter(
        query as unknown as {
          eq: (field: string, value: string) => unknown;
          in: (field: string, values: string[]) => unknown;
        },
        resolvedFilter,
      ) as typeof query;
    }

    query = (query as unknown as {
      order: (field: string, opts: { ascending: boolean }) => typeof query
    }).order("is_premium", { ascending: false });

    switch (sortBy) {
      case "recommendations_count":
        query = (query as unknown as {
          order: (field: string, opts: { ascending: boolean }) => typeof query
        }).order("recommendations_count", { ascending: false })
          .order("rating", { ascending: false });
        break;
      case "name":
        query = (query as unknown as {
          order: (field: string, opts: { ascending: boolean }) => typeof query
        }).order("business_name", { ascending: true });
        break;
      case "created_at":
        query = (query as unknown as {
          order: (field: string, opts: { ascending: boolean }) => typeof query
        }).order("created_at", { ascending: false });
        break;
      case "rating":
      default:
        query = (query as unknown as {
          order: (field: string, opts: { ascending: boolean }) => typeof query
        }).order("rating", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      logger.warn("⚠️ Error fetching businesses list:", (error as { message?: string }).message);
      return { businesses: [], nextPage: undefined };
    }

    // Fetch profiles
    const profileIds =
      ((data as Array<{ profile_id: string }>) || [])
        .map((d) => d.profile_id)
        .filter(Boolean) || [];
    const profilesMap = new Map<string, { id: string; name: string }>();

    if (profileIds.length > 0) {
      const profilesData = await profileService.getProfilesByIds(profileIds);
      profilesData.forEach((p: { id: string; name: string }) => profilesMap.set(p.id, p));
    }

    const businesses = ((data as BusinessDataWithProfiles[]) || []).map((d) =>
      mapBusinessDataToBusiness({
        ...d,
        profiles: profilesMap.get(d.profile_id) || {
          id: d.profile_id,
          name: (d as unknown as { business_name?: string }).business_name || "Empresa",
        },
      } as BusinessDataWithProfiles),
    );

    return {
      businesses,
      nextPage: data && (data as unknown[]).length === pageSize ? pageParam + 1 : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("⚠️ Unexpected error in getBusinessesList:", message);
    return { businesses: [], nextPage: undefined };
  }
}

export async function getRecentBusinesses(
  limit = 10,
): Promise<Array<{ id: string; name: string; created_at: string }>> {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const { data, error } = await supabaseTyped
      .from("business_data")
      .select("profile_id, business_name, created_at")
      .eq("status", "active")
      .in("business_role", ["standalone", "branch"])
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      logger.error("Error fetching recent businesses", error);
      return [];
    }

    return ((data as unknown[]) || []).map((row) => {
      const business = row as {
        profile_id?: string | null;
        business_name?: string | null;
        created_at?: string | null;
      };

      return {
        id: business.profile_id ?? "",
        name: business.business_name ?? "Empresa",
        created_at: business.created_at ?? "",
      };
    });
  } catch (error) {
    logger.error("Error in getRecentBusinesses", error as Error);
    return [];
  }
}

/**
 * Buscar perfil básico da empresa (para URLs e metadados)
 */
export async function getBusinessProfile(id: string): Promise<{
  slug: string;
  nicho: string;
  city: string;
  neighborhood: string;
  is_premium: boolean;
} | null> {
  try {
    const { data, error } = await supabaseTyped.from("business_data")
      .select("slug, category, metadata, is_premium")
      .eq("profile_id", id)
      .single();

    if (error || !data) return null;

    const typedData = data as {
      slug?: string;
      category?: string;
      is_premium?: boolean;
      metadata?: { city?: string; neighborhood?: string };
    };
    const metadata = typedData.metadata || {};

    return {
      slug: typedData.slug || "",
      nicho: typedData.category || "",
      city: metadata.city || "",
      neighborhood: metadata.neighborhood || "",
      is_premium: typedData.is_premium || false,
    };
  } catch (error) {
    logger.error("Error fetching business profile:", error);
    return null;
  }
}

/**
 * Buscar empresa por ID
 * ETAPA 9: Carrega relações canônicas
 */
export async function getBusinessById(id: string): Promise<Business> {
  // Validação
  if (!isValidBusinessId(id)) {
    throw new Error("ID de empresa inválido");
  }

  try {
    const { data, error } = await supabaseTyped.from("business_data")
      .select(`
        *,
        profiles(id, name, avatar_url, phone, whatsapp, bio),
        address:addresses!address_id(*),
        location:locations!location_id(*)
      `)
      .eq("profile_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Empresa não encontrada");

    return mapBusinessDataToBusiness(data as BusinessDataWithProfiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao buscar empresa: ${message}`);
  }
}

/**
 * Buscar business_data.id pelo profile_id da empresa
 */
export async function getBusinessDataIdByProfileId(
  profileId: string,
): Promise<string | null> {
  if (!isValidBusinessId(profileId)) {
    return null;
  }

  try {
    const { data, error } = await supabaseTyped
      .from("business_data")
      .select("id, business_role, updated_at")
      .eq("profile_id", profileId)
      .in("business_role", ["standalone", "branch"])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      logger.error("Error fetching business_data id by profile_id:", error);
      return null;
    }

    const rows = (data as Array<{ id?: string }> | null) ?? [];
    return rows[0]?.id ?? null;
  } catch (error) {
    logger.error("Error in getBusinessDataIdByProfileId:", error);
    return null;
  }
}

/**
 * Buscar empresa por slug
 */
export async function getBusinessBySlug(slug: string): Promise<{
  id: string;
  slug: string;
  name: string;
  is_premium?: boolean;
} | null> {
  // Validação
  if (!isValidSlug(slug)) {
    logger.warn("Invalid slug provided to getBusinessBySlug", { slug });
    return null;
  }

  try {
    const { data, error } = await supabaseTyped.from("business_data")
      .select("id, profile_id, slug, business_name, is_premium")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      logger.error("Error fetching business by slug:", error);
      return null;
    }

    if (!data) return null;

    const typedData = data as {
      id?: string;
      profile_id?: string;
      slug: string;
      business_name?: string;
      is_premium?: boolean;
    };

    return {
      id: typedData.profile_id || typedData.id || "",
      slug: typedData.slug,
      name: typedData.business_name || "",
      is_premium: typedData.is_premium,
    };
  } catch (error) {
    logger.error("Error in getBusinessBySlug:", error);
    return null;
  }
}

export {
  checkSlugExists,
  getSimilarSlugs,
} from "./business.slug-queries";

/**
 * Buscar businesses por IDs (para uso em serviços agregadores)
 * FASE 1 IA: Usa public_business_search (view pública segura)
 */
export async function getBusinessesByIds(
  ids: string[],
): Promise<
  Array<{
    id: string;
    name: string;
    category: string;
    slug?: string;
    neighborhood?: string;
    city?: string;
    logo?: string;
    rating?: number;
    verified?: boolean;
    is_premium?: boolean;
    geographic_path?: string | null;
    description?: string;
  }>
> {
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabaseTyped.from("public_business_search")
      .select(`
        profile_id,
        business_name,
        category,
        slug,
        description,
        rating,
        is_premium,
        is_verified,
        metadata,
        geographic_path
      `)
      .in("profile_id", ids);

    if (error) {
      logger.error("Error getting businesses by IDs", error, { ids });
      return [];
    }

    return ((data as unknown[]) || []).map((b: unknown) => {
      const typed = b as {
        profile_id?: string;
        business_name?: string;
        category?: string;
        slug?: string;
        metadata?: {
          neighborhood?: string;
          city?: string;
          logo_url?: string;
        };
        rating?: number;
        is_verified?: boolean;
        is_premium?: boolean;
        geographic_path?: string | null;
        description?: string;
      };

      return {
        id: typed.profile_id || "",
        name: typed.business_name || "",
        category: typed.category || "",
        slug: typed.slug,
        neighborhood: typed.metadata?.neighborhood,
        city: typed.metadata?.city,
        logo: typed.metadata?.logo_url || undefined,
        rating: typeof typed.rating === "number" ? typed.rating : 0,
        verified: Boolean(typed.is_verified),
        is_premium: Boolean(typed.is_premium),
        geographic_path: typed.geographic_path ?? null,
        description: typed.description || undefined,
      };
    });
  } catch (error) {
    logger.error("Error getting businesses by IDs", error as Error, { ids });
    return [];
  }
}

/**
 * Buscar businesses por nome (para autocomplete/menções)
 */
export async function searchBusinessesByName(
  query: string,
  limit = 5,
): Promise<Array<{ id: string; name: string; category: string }>> {
  if (query.length < 2) return [];

  try {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) return [];

    const sanitizedQuery = sanitizeForILike(sanitized);
    if (!sanitizedQuery) return [];

    const { data, error } = await supabaseTyped.from("business_data")
      .select("profile_id, business_name, category")
      .eq("status", "active")
      .ilike("business_name", `%${sanitizedQuery}%`)
      .limit(limit);

    if (error) {
      logger.error("Error searching businesses by name", error, { query });
      return [];
    }

    return ((data as unknown[]) || []).map((b: unknown) => {
      const typed = b as { profile_id?: string; business_name?: string; category?: string };
      return {
        id: typed.profile_id || "",
        name: typed.business_name || "",
        category: typed.category || "",
      };
    });
  } catch (error) {
    logger.error("Error searching businesses by name", error as Error, { query });
    return [];
  }
}

/**
 * Obter produtos de uma empresa
 */
export async function getProducts(businessId: string): Promise<Product[]> {
  // Validação
  if (!isValidBusinessId(businessId)) {
    throw new Error("ID de empresa inválido");
  }

  try {
    const { data, error } = await supabaseAny.from("business_products")
      .select("*")
      .eq("profile_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data as ProductRecord[]) || []).map(mapProductRecordToProduct);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao buscar produtos: ${message}`);
  }
}

/**
 * Buscar página de produtos ativos
 */
export async function getProductsPage(
  businessId: string,
  page: number,
  pageSize: number,
): Promise<Product[]> {
  // Validação
  if (!isValidBusinessId(businessId)) {
    throw new Error("ID de empresa inválido");
  }
  if (!isValidPageParam(page)) {
    throw new Error("Número de página inválido");
  }
  if (!isValidPageSize(pageSize)) {
    throw new Error("Tamanho de página inválido");
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabaseAny.from("business_products")
    .select("*")
    .eq("profile_id", businessId)
    .eq("ativo", true)
    .order("destaque", { ascending: false })
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Erro ao buscar página de produtos: ${(error as { message?: string }).message}`);
  }

  return ((data as ProductRecord[]) || []).map(mapProductRecordToProduct);
}

/**
 * Buscar serviços de uma empresa
 */
export async function getServices(businessId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseAny.from("business_services")
      .select("*")
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;
    return (data as unknown[]) || [];
  } catch (error) {
    logger.error("Error fetching business services:", error);
    return [];
  }
}

/**
 * Buscar empresas similares (mesma categoria)
 */
export async function getSimilarBusinesses(
  businessId: string,
  category: string,
  limit = 5,
): Promise<Partial<Business>[]> {
  try {
    const { data, error } = await supabaseTyped.from("business_data")
      .select(`
        profile_id,
        business_name,
        category,
        slug,
        is_verified,
        is_premium
      `)
      .eq("category", category)
      .eq("status", "active")
      .neq("profile_id", businessId)
      .limit(limit);

    if (error) {
      logger.error("Error fetching similar businesses:", error);
      return [];
    }

    return ((data as unknown[]) || []).map((item: unknown) => {
      const typed = item as {
        profile_id?: string;
        business_name?: string;
        category?: string;
        slug?: string;
        is_verified?: boolean;
        is_premium?: boolean;
      };

      return {
        id: typed.profile_id,
        name: typed.business_name,
        slug: typed.slug,
        category: typed.category,
        is_premium: typed.is_premium || false,
        is_verified: typed.is_verified,
      } as Partial<Business>;
    });
  } catch (error) {
    logger.error("Error in getSimilarBusinesses:", error);
    return [];
  }
}

/**
 * Buscar galeria de imagens
 */
export async function getGallery(businessId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseTyped.from("business_gallery")
      .select("image_url")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching business gallery:", error);
      return [];
    }

    const directImages = ((data as Array<{ image_url?: string }>) || [])
      .map((item) => item.image_url)
      .filter((url): url is string => Boolean(url));

    if (directImages.length > 0) {
      return directImages;
    }

    const businessDataId = await getBusinessDataIdByProfileId(businessId);
    if (!businessDataId || businessDataId === businessId) {
      return [];
    }

    const { data: fallbackData, error: fallbackError } = await supabaseTyped
      .from("business_gallery")
      .select("image_url")
      .eq("business_id", businessDataId)
      .order("created_at", { ascending: false });

    if (fallbackError) {
      logger.error("Error fetching business gallery by profile fallback:", fallbackError);
      return [];
    }

    return ((fallbackData as Array<{ image_url?: string }>) || [])
      .map((item) => item.image_url)
      .filter((url): url is string => Boolean(url));
  } catch (error) {
    logger.error("Error in getGallery:", error);
    return [];
  }
}
