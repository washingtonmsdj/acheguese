import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationService } from "@/core/location/services/LocationService";
import { resolveLocationDescendants } from "@/core/location/utils/resolveLocationDescendants";
import type { TerritoryFilter } from "@/core/location/types";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { CLASSIFIED_STATUS } from "../constants/statuses";
import {
  CLASSIFIED_READ_SELECT,
  mapClassifiedReadModel,
  type ClassifiedReadRow,
} from "./classifieds.read-model";
import type { ClassifiedData } from "./types";

export type ClassifiedMapBounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload = {
  data: ClassifiedReadRow[] | null;
  error: ErrorLike;
};

type ClassifiedMapQuery = PromiseLike<QueryPayload> & {
  select(columns?: string): ClassifiedMapQuery;
  eq(column: string, value: unknown): ClassifiedMapQuery;
  in(column: string, values: readonly string[]): ClassifiedMapQuery;
  or(filters: string): ClassifiedMapQuery;
  gte(column: string, value: number): ClassifiedMapQuery;
  lte(column: string, value: number): ClassifiedMapQuery;
  order(column: string, options?: { ascending?: boolean }): ClassifiedMapQuery;
  limit(count: number): ClassifiedMapQuery;
};

type ClassifiedMapDbClient = {
  from(table: "classifieds"): ClassifiedMapQuery;
};

const classifiedMapDb = supabase as unknown as ClassifiedMapDbClient;
const locationReadService = new LocationService(createLocationRepository());
const DEFAULT_CLASSIFIED_MAP_LIMIT = 100;
const MAX_CLASSIFIED_MAP_LIMIT = 200;

function validateBounds(bounds: ClassifiedMapBounds): void {
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error("getClassifiedsByBounds requires finite bounds");
  }
  if (west >= east || south >= north) {
    throw new Error("getClassifiedsByBounds received inverted bounds");
  }
}

function normalizeLimit(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return DEFAULT_CLASSIFIED_MAP_LIMIT;
  return Math.max(1, Math.min(MAX_CLASSIFIED_MAP_LIMIT, Math.trunc(value)));
}

async function resolveParentCityId(
  filter: TerritoryFilter | undefined,
): Promise<string | null> {
  if (filter?.scope !== "location") return null;

  try {
    const { location } = await locationReadService.getLocationById({
      id: filter.location_id,
    });
    return location.type === "district" ? location.parent_id : null;
  } catch (error) {
    logger.warn("[ClassifiedMapQueries] failed to resolve parent city", {
      location_id: filter.location_id,
      error,
    });
    return null;
  }
}

/**
 * Canonical Classifieds read for map viewports.
 *
 * Bounds are applied before LIMIT and before rows leave Postgres. Territory
 * semantics match the public classifieds listing: location scope expands to
 * descendants, and a district may also inherit city-reach classifieds.
 */
export async function getClassifiedsByBounds(
  bounds: ClassifiedMapBounds,
  options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
): Promise<ClassifiedData[]> {
  const { territoryFilter } = options;
  if (territoryFilter?.scope === "none") return [];

  validateBounds(bounds);
  const [west, south, east, north] = bounds;
  const limit = normalizeLimit(options.limit);

  const [resolvedFilter, parentCityId] = await Promise.all([
    territoryFilter
      ? resolveLocationDescendants(territoryFilter)
      : Promise.resolve<TerritoryFilter | undefined>(undefined),
    resolveParentCityId(territoryFilter),
  ]);

  let query = classifiedMapDb
    .from("classifieds")
    .select(CLASSIFIED_READ_SELECT)
    .eq("is_active", true)
    .eq("status", CLASSIFIED_STATUS.ACTIVE)
    .gte("longitude", west)
    .lte("longitude", east)
    .gte("latitude", south)
    .lte("latitude", north)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (resolvedFilter?.scope === "location") {
    query = query.eq("location_id", resolvedFilter.location_id);
  } else if (resolvedFilter?.scope === "group") {
    if (parentCityId) {
      query = query.or(
        `location_id.in.(${resolvedFilter.location_ids.join(",")}),and(location_id.eq.${parentCityId},reach.eq.city)`,
      );
    } else {
      query = query.in("location_id", resolvedFilter.location_ids);
    }
  }

  const { data, error } = await query;
  if (error) {
    logger.error("[ClassifiedMapQueries] bounded read failed", error);
    throw error;
  }

  return (data ?? []).map(mapClassifiedReadModel);
}
