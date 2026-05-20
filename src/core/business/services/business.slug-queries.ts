import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";

const supabaseAny = supabase as any;

export async function checkSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    let query = supabaseAny
      .from("business_data")
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
    const { data, error } = await supabaseAny
      .from("business_data")
      .select("slug")
      .ilike("slug", `${slug}%`)
      .limit(limit);

    if (error) {
      logger.error("Error getting similar business slugs:", error);
      throw error;
    }

    return ((data as Array<{ slug?: string }> | null) ?? [])
      .map((item) => item.slug)
      .filter((item): item is string => Boolean(item));
  } catch (error) {
    logger.error("Error in getSimilarSlugs:", error);
    throw error;
  }
}
