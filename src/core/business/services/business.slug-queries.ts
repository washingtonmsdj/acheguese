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
