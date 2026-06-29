/**
 *  CLASSIFIEDS QUERIES - SSOT Read Model
 *
 *  Todas as operacoes de leitura para classificados.
 *  Sem side effects, sem mutations.
 *
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { applyTerritoryFilter } from "@/core/location";
import { LocationService } from "@/core/location/services/LocationService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import type { TerritoryFilter } from "@/core/location/types";
import type { ClassifiedData, NeighborhoodWithClassifiedCount } from "./types";

//  Instancia do LocationService com repositorio
const locationService = new LocationService(createLocationRepository());

type ClassifiedSellerRow = {
  name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

type ClassifiedCategoryRow = { slug?: string | null };

type ClassifiedLocationPathRow = { geographic_path?: string | null };

type ClassifiedWithRelationsRow = ClassifiedData & {
  seller?: ClassifiedSellerRow | null;
  locations?: ClassifiedLocationPathRow | null;
  classified_categories?: ClassifiedCategoryRow | null;
  classified_subcategories?: ClassifiedCategoryRow | null;
};

type NeighborhoodLocationRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

type NeighborhoodClassifiedRow = {
  location_id: string;
  locations: NeighborhoodLocationRow | null;
};

type ErrorLike = {
  code?: string | null;
  message?: string | null;
};

type ClassifiedQueryPayload = {
  data: ClassifiedWithRelationsRow[] | null;
  error: ErrorLike | null;
};

type ClassifiedQuery = PromiseLike<ClassifiedQueryPayload> & {
  eq(column: string, value: unknown): ClassifiedQuery;
  in(column: string, values: string[]): ClassifiedQuery;
  or(filters: string): ClassifiedQuery;
  order(column: string, options?: { ascending?: boolean }): ClassifiedQuery;
  select(columns?: string): ClassifiedQuery;
};

function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

//  ============================================================
//  HELPERS INTERNOS
//  ============================================================

/**
 *  Mapeia resposta do Supabase para ClassifiedData com seller info
 */
function mapClassifiedWithSeller(item: ClassifiedWithRelationsRow): ClassifiedData {
  return {
    ...item,
    photos: ensureStringArray((item as { photos?: unknown }).photos),
    seller_name: item.seller?.name,
    seller_avatar: item.seller?.avatar_url,
    seller_phone: item.seller?.phone,
    seller_whatsapp: item.seller?.whatsapp,
    geographic_path: item.locations?.geographic_path,
    category_slug: item.classified_categories?.slug,
    subcategory_slug: item.classified_subcategories?.slug,
  };
}

function mapRawClassified(item: Record<string, unknown>): ClassifiedData {
  return {
    ...(item as unknown as ClassifiedData),
    photos: ensureStringArray(item.photos),
    seller_name: (item.seller as ClassifiedSellerRow | undefined)?.name,
    seller_avatar: (item.seller as ClassifiedSellerRow | undefined)?.avatar_url,
    seller_phone: (item.seller as ClassifiedSellerRow | undefined)?.phone,
    seller_whatsapp: (item.seller as ClassifiedSellerRow | undefined)?.whatsapp,
  };
}

//  ============================================================
//  QUERIES - LISTAGEM E BUSCA
//  ============================================================

/**
 *  Busca bairros com anncios ativos por cidade.
 */
export async function getNeighborhoodsWithClassifieds(
  cityId: string,
): Promise<NeighborhoodWithClassifiedCount[]> {
  const { data, error } = await supabase
    .from("classifieds")
    .select("location_id, locations!inner(id, name, slug, parent_id)")
    .eq("is_active", true)
    .eq("status", "approved")
    .eq("locations.parent_id", cityId);

  if (error) {
    logger.error("Error fetching neighborhoods with classifieds:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const countMap = new Map<string, { name: string; slug: string; count: number }>();

  (data as NeighborhoodClassifiedRow[]).forEach((item) => {
    const location = item.locations;
    if (!location) return;

    const existing = countMap.get(location.id);
    if (existing) {
      existing.count += 1;
    } else {
      countMap.set(location.id, {
        name: location.name,
        slug: location.slug,
        count: 1,
      });
    }
  });

  return Array.from(countMap.entries())
    .map(([id, location]) => ({
      location_id: id,
      location_name: location.name,
      location_slug: location.slug,
      count: location.count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 *  Busca todos os classificados ativos, com filtro territorial opcional.
 *
 *  @param filter - TerritoryFilter cannico.
 *  scope: 'location' .eq('location_id', id) + descendentes (hierrquico) + anncios globais
 *  scope: 'group' .in('location_id', ids) + anncios globais
 *  scope: 'none' sem filtro territorial (retorna todos)
 *
 *  SSOT: Inclui anncios com reach='city' ou 'state' quando aplicvel
 */
export async function getAllClassifieds(
  filter?: TerritoryFilter,
): Promise<ClassifiedData[]> {
  try {
    let query = supabase
      .from("classifieds")
      .select(
        `
        * ,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        ),
        locations(geographic_path, type, parent_id),
        classified_categories(slug),
        classified_subcategories(slug)
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }) as unknown as ClassifiedQuery;

    //  HIERRQUICO - Resolve descendentes antes de aplicar filtro
    let resolvedFilter = filter;
    let parentCityId: string | null = null;

    if (filter?.scope === "location") {
      //  Busca location + todos descendentes via RPC
      const { data: descendantIds, error: rpcError } = await supabase.rpc(
        "rpc_get_location_descendants_ids",
        { p_location_id: filter.location_id },
      );

      //  SSOT - Busca informaes da location via LocationService
      try {
        const { location } = await locationService.getLocationById({
          id: filter.location_id,
        });

        if (location.type === "district" && location.parent_id) {
          parentCityId = location.parent_id;
        }
      } catch (error) {
        logger.error(
          "[ClassifiedsQueries] Failed to get location info",
          error as Error,
          { location_id: filter.location_id },
        );
      }

      if (!rpcError && descendantIds && descendantIds.length > 0) {
        //  Converte para scope='group' com array de IDs
        resolvedFilter = {
          scope: "group",
          location_ids: descendantIds,
        };
      }
      //  Se erro, mantm filter original (exact match)
    }

    //  Aplica filtro resolvido (se scope !== 'none', aplica filtro)
    if (resolvedFilter && resolvedFilter.scope !== "none") {
      //  NOVIDADE: Busca anncios locais + anncios com alcance maior
      if (resolvedFilter.scope === "group") {
        //  Anncios do bairro/cidade OU anncios com reach='city' da cidade pai
        if (parentCityId) {
          //  Estamos em um bairro: incluir anncios do bairro + anncios com reach='city' da cidade
          query = query.or(
            `location_id.in.(${resolvedFilter.location_ids.join(",")}),and(location_id.eq.${parentCityId},reach.eq.city)`,
          );
        } else {
          //  Estamos em uma cidade: apenas anncios da cidade e descendentes
          query = query.in("location_id", resolvedFilter.location_ids);
        }
      } else {
        query = applyTerritoryFilter(query, resolvedFilter);
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching classifieds:", error);
      throw error;
    }

    return ((data || []) as unknown[]).map((item) =>
      mapClassifiedWithSeller(item as ClassifiedWithRelationsRow),
    );
  } catch (error) {
    logger.error("Error in getAllClassifieds:", error);
    trackError(error as Error, {
      component: "ClassifiedsQueries",
      action: "getAllClassifieds",
    });
    throw error;
  }
}

/**
 *  Busca um classificado por ID
 */
export async function getClassifiedById(id: string): Promise<ClassifiedData | null> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        * ,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        ),
        locations(geographic_path, type, parent_id),
        classified_categories(slug),
        classified_subcategories(slug)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      logger.error("Error fetching classified:", error);
      throw error;
    }

    return mapClassifiedWithSeller(data as ClassifiedWithRelationsRow);
  } catch (error) {
    logger.error("Error in getClassifiedById:", error);
    trackError(error as Error, {
      component: "ClassifiedsQueries",
      action: "getClassifiedById",
    });
    throw error;
  }
}

/**
 *  Busca classificados por categoria
 */
export async function getClassifiedsByCategory(category: string): Promise<ClassifiedData[]> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        * ,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        ),
        locations(geographic_path, type, parent_id),
        classified_categories(slug),
        classified_subcategories(slug)
      `,
      )
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching classifieds by category:", error);
      throw error;
    }

    return ((data || []) as unknown[]).map((item) =>
      mapClassifiedWithSeller(item as ClassifiedWithRelationsRow),
    );
  } catch (error) {
    logger.error("Error in getClassifiedsByCategory:", error);
    trackError(error as Error, {
      component: "ClassifiedsQueries",
      action: "getClassifiedsByCategory",
    });
    throw error;
  }
}

/**
 *  Busca classificados do usurio
 */
export async function getUserClassifieds(userId: string): Promise<ClassifiedData[]> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        * ,
        seller:profiles!seller_id (
          id,
          name,
          avatar_url,
          phone,
          whatsapp
        ),
        locations(geographic_path, type, parent_id),
        classified_categories(slug),
        classified_subcategories(slug)
      `,
      )
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching user classifieds:", error);
      throw error;
    }

    return ((data || []) as unknown[]).map((item) =>
      mapClassifiedWithSeller(item as ClassifiedWithRelationsRow),
    );
  } catch (error) {
    logger.error("Error in getUserClassifieds:", error);
    trackError(error as Error, {
      component: "ClassifiedsQueries",
      action: "getUserClassifieds",
    });
    throw error;
  }
}

/**
 *  Busca classificados de um vendedor especfico
 */
export async function getClassifiedsBySeller(sellerId: string): Promise<ClassifiedData[]> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        * ,
        seller:profiles!seller_id (
          id, name, avatar_url, phone, whatsapp
        ),
        locations(geographic_path, type, parent_id),
        classified_categories(slug),
        classified_subcategories(slug)
      `,
      )
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching classifieds by seller:", error);
      throw error;
    }

    return ((data || []) as unknown[]).map((item) =>
      mapClassifiedWithSeller(item as ClassifiedWithRelationsRow),
    );
  } catch (error) {
    logger.error("Error in getClassifiedsBySeller:", error);
    return [];
  }
}

//  ============================================================
//  QUERIES - Estatisticas ADMINISTRATIVAS
//  ============================================================

/**
 *  OBTER CONTAGEM TOTAL DE CLASSIFICADOS
 *  SSOT para contagem de classificados no dashboard admin
 */
export async function getTotalClassifiedsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("classifieds")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error("Error getting classifieds count", error, {
        service: "ClassifiedsQueries",
        method: "getTotalClassifiedsCount",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting classifieds count", error as Error, {
      service: "ClassifiedsQueries",
      method: "getTotalClassifiedsCount",
    });
    return 0;
  }
}

/**
 *  OBTER CLASSIFICADOS RECENTES
 *  SSOT para atividade recente de classificados
 */
export async function getRecentClassifieds(limit = 10): Promise<ClassifiedData[]> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Error getting recent classifieds", error, {
        service: "ClassifiedsQueries",
        method: "getRecentClassifieds",
        limit,
      });
      return [];
    }

    return (data || []).map((item) => mapRawClassified(item as Record<string, unknown>));
  } catch (error) {
    logger.error("Error getting recent classifieds", error as Error, {
      service: "ClassifiedsQueries",
      method: "getRecentClassifieds",
    });
    return [];
  }
}

/**
 *  OBTER CLASSIFICADOS CRIADOS EM UM PERODO
 *  SSOT para atividade de classificados por perodo
 */
export async function getClassifiedsCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("classifieds")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      logger.error("Error getting classifieds in period", error, {
        service: "ClassifiedsQueries",
        method: "getClassifiedsCreatedInPeriod",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting classifieds in period", error as Error, {
      service: "ClassifiedsQueries",
      method: "getClassifiedsCreatedInPeriod",
    });
    return 0;
  }
}

//  ============================================================
//  QUERIES - VENDEDORES
//  ============================================================

/**
 *  Lista vendedores com contagem de anncios ativos
 */
export async function getSellersWithAds(
  filter?: TerritoryFilter,
): Promise<
  Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    neighborhood: string;
    active_ads_count: number;
    featured_ads: ClassifiedData[];
  }>
> {
  try {
    //  Busca todos classificados ativos (reutiliza filtro territorial)
    const allAds = await getAllClassifieds(filter);

    //  Agrupa por vendedor
    const sellerMap = new Map<
      string,
      {
        id: string;
        name: string;
        avatar_url: string | null;
        neighborhood: string;
        ads: ClassifiedData[];
      }
    >();

    for (const ad of allAds) {
      if (!ad.seller_id) continue;
      if (!sellerMap.has(ad.seller_id)) {
        sellerMap.set(ad.seller_id, {
          id: ad.seller_id,
          name: ad.seller_name || "Vendedor",
          avatar_url: ad.seller_avatar || null,
          neighborhood: ad.neighborhood || ad.location || "",
          ads: [],
        });
      }
      sellerMap.get(ad.seller_id)!.ads.push(ad);
    }

    return Array.from(sellerMap.values())
      .map((seller) => ({
        id: seller.id,
        name: seller.name,
        avatar_url: seller.avatar_url,
        neighborhood: seller.neighborhood,
        active_ads_count: seller.ads.length,
        featured_ads: seller.ads.slice(0, 3),
      }))
      .sort((a, b) => b.active_ads_count - a.active_ads_count);
  } catch (error) {
    logger.error("Error in getSellersWithAds:", error);
    return [];
  }
}
