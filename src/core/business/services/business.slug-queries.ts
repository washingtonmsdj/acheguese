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

export async function getSlugHistory(businessId: string): Promise<Array<{
  id: string;
  old_slug: string;
  change_reason: string | null;
  created_at: string;
}>> {
  try {
    const { data, error } = await supabaseAny
      .from("business_slug_history")
      .select("id, old_slug, change_reason, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error getting business slug history:", error);
      throw error;
    }

    return (data as Array<{
      id: string;
      old_slug: string;
      change_reason: string | null;
      created_at: string;
    }> | null) ?? [];
  } catch (error) {
    logger.error("Error in getSlugHistory:", error);
    throw error;
  }
}

export async function resolveOldSlug(oldSlug: string): Promise<{
  businessId: string;
  currentSlug: string;
} | null> {
  try {
    const { data: history, error: historyError } = await supabaseAny
      .from("business_slug_history")
      .select("business_id")
      .eq("old_slug", oldSlug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historyError) {
      logger.error("Error resolving old business slug history:", historyError);
      throw historyError;
    }

    if (!history?.business_id) {
      return null;
    }

    const { data: business, error: businessError } = await supabaseAny
      .from("business_data")
      .select("id, slug")
      .eq("id", history.business_id)
      .maybeSingle();

    if (businessError) {
      logger.error("Error resolving current business slug:", businessError);
      throw businessError;
    }

    if (!business?.id || !business?.slug) {
      return null;
    }

    return {
      businessId: business.id,
      currentSlug: business.slug,
    };
  } catch (error) {
    logger.error("Error in resolveOldSlug:", error);
    throw error;
  }
}
