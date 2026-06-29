import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  ilike: (column: string, pattern: string) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  neq: (column: string, value: unknown) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
}

interface BusinessSlugQueriesDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface SlugRow {
  id?: string;
  slug?: string | null;
}

const businessSlugQueriesDb = supabase as unknown as BusinessSlugQueriesDbClient;

export async function checkSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    let query = businessSlugQueriesDb
      .from<SlugRow>("business_data")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error("Error checking business slug existence:", error);
      throw error;
    }

    return Boolean(data);
  } catch (error) {
    logger.error("Error in checkSlugExists:", error);
    throw error;
  }
}

export async function getSimilarSlugs(
  slug: string,
  limit = PAGINATION.DEFAULT_LIMIT,
): Promise<string[]> {
  try {
    const { data, error } = await businessSlugQueriesDb
      .from<SlugRow>("business_data")
      .select("slug")
      .ilike("slug", `${slug}%`)
      .limit(limit);

    if (error) {
      logger.error("Error getting similar business slugs:", error);
      throw error;
    }

    return (data ?? [])
      .map((item) => item.slug)
      .filter((item): item is string => Boolean(item));
  } catch (error) {
    logger.error("Error in getSimilarSlugs:", error);
    throw error;
  }
}
