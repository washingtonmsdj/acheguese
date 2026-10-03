import { supabase } from "@/integrations/supabase";
import { getCurrentUserBusinessFavorites } from "@/core/favorites/services/favorites.queries";
import type { ProfileRow as Profile } from "./types";
import type { BusinessRow } from "./profile.service.types";

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  neq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
}

interface ProfileExternalDataDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
  rpc: <TRow = never>(
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<QueryArrayResult<TRow>>;
}

const profileExternalDataDb = supabase as unknown as ProfileExternalDataDbClient;

type BusinessProfileRelation = {
  name?: string | null;
  neighborhood?: string | null;
  city?: string | null;
};

type BusinessLocationRelation = {
  geographic_path?: string | null;
};

type BusinessQueryRow = Omit<BusinessRow, "profiles" | "geographic_path"> & {
  created_at?: string | null;
  profiles?: BusinessProfileRelation | BusinessProfileRelation[] | null;
  location?: BusinessLocationRelation | BusinessLocationRelation[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeBusinessQueryRows(
  rows: readonly BusinessQueryRow[],
): BusinessRow[] {
  return rows.map((row) => {
    const { location, profiles, ...business } = row;
    return {
      ...business,
      profiles: firstRelation(profiles),
      geographic_path: firstRelation(location)?.geographic_path ?? null,
    };
  });
}

export async function getUserBusinessesByProfilesQuery(
  profileIds: string[],
): Promise<BusinessRow[]> {
  if (!profileIds.length) return [];

  const { data, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
      id,
      profile_id,
      business_name,
      category,
      metadata,
      rating,
      is_premium,
      is_verified,
      slug,
      description,
      created_at,
      profiles(name, neighborhood, city),
      location:locations!location_id(geographic_path)
    `,
    )
    .in("profile_id", profileIds)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeBusinessQueryRows(data ?? []);
}

export async function getUserBusinessesQuery(profileId: string): Promise<BusinessRow[]> {
  const { data, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
      id,
      profile_id,
      business_name,
      category,
      metadata,
      slug,
      is_verified,
      is_premium,
      description,
      created_at,
      profiles(name, neighborhood, city)
    `,
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function searchProfilesByNameQuery(
  searchQuery: string,
  maxResults: number,
): Promise<Profile[]> {
  const { data, error } = await profileExternalDataDb.rpc<Profile>(
    "search_profiles_by_name",
    {
      search_query: searchQuery,
      max_results: maxResults,
    },
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getCurrentUserFavoriteBusinessesQuery(): Promise<BusinessRow[]> {
  const businessIds = await getCurrentUserBusinessFavorites();
  if (!businessIds.length) return [];

  const { data: businesses, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
      id,
      profile_id,
      business_name,
      category,
      metadata,
      slug,
      is_verified,
      is_premium,
      description,
      profiles(name, neighborhood, city)
    `,
    )
    .in("profile_id", businessIds)
    .eq("status", "active");

  if (error) return [];
  return businesses ?? [];
}