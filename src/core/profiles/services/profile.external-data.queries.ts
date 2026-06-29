import { supabase } from "@/integrations/supabase";
import { getUserBusinessFavorites } from "@/core/favorites/services";
import type { ProfileRow as Profile } from "./types";
import type { BusinessRow } from "./profile.service.types";
import { resolveOwnedProfileIds } from "./profile.queries";

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

type BusinessQueryRow = BusinessRow & {
  created_at?: string | null;
  profiles?:
    | {
        name?: string | null;
        neighborhood?: string | null;
        city?: string | null;
      }
    | Array<{
        name?: string | null;
        neighborhood?: string | null;
        city?: string | null;
      }>
    | null;
};

export async function getUserBusinessesByProfilesQuery(
  profileIds: string[],
): Promise<BusinessRow[]> {
  if (!profileIds.length) return [];

  const { data, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
      profile_id,
      business_name,
      category,
      metadata,
      rating,
      is_premium,
      is_verified,
      slug,
      description,
      created_at
    `,
    )
    .in("profile_id", profileIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getUserBusinessesQuery(profileId: string): Promise<BusinessRow[]> {
  const { data, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
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

export async function getUserFavoritesCountQuery(userId: string): Promise<number> {
  try {
    const profileIds = await resolveOwnedProfileIds(userId);
    if (profileIds.length === 0) return 0;

    const { count, error } = await profileExternalDataDb
      .from<{ id: string }>("profile_favorites_new")
      .select("*", { count: "exact", head: true })
      .in("favoriting_profile_id", profileIds);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function getUserFavoriteBusinessesQuery(userId: string): Promise<BusinessRow[]> {
  const ownerProfileIds = await resolveOwnedProfileIds(userId);
  if (ownerProfileIds.length === 0) return [];

  const businessIdGroups = await Promise.all(
    ownerProfileIds.map((profileId) => getUserBusinessFavorites(profileId)),
  );

  const businessIds = [...new Set(businessIdGroups.flat().filter(Boolean))];
  if (!businessIds.length) return [];

  const { data: businesses, error } = await profileExternalDataDb
    .from<BusinessQueryRow>("business_data")
    .select(
      `
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
