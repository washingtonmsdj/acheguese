import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export async function checkSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    let query = supabase
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

export async function getSlugsByPrefix(
  prefix: string,
  limit = 20,
): Promise<string[]> {
  const normalizedPrefix = prefix.trim().toLocaleLowerCase("pt-BR");
  if (!normalizedPrefix) return [];

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const { data, error } = await supabase
    .from("business_data")
    .select("slug")
    .ilike("slug", `${normalizedPrefix}%`)
    .limit(safeLimit);

  if (error) {
    logger.error("Error fetching Business slugs by prefix:", error);
    throw error;
  }

  return (data ?? [])
    .map((row) => row.slug)
    .filter((slug): slug is string => Boolean(slug));
}
