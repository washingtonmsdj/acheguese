/**
 * POSTS MEDIA/METRICS QUERIES - SSOT
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { resolveCityToLocationIds, resolveNeighborhoodInCity } from "@/core/location/helpers/territorialResolver";
import { mapPostsWithImagesRows } from "./post.service.rules";
export async function getPostsCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      trackError(error, {
        component: "posts.queries",
        action: "getPostsCreatedInPeriod",
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsCreatedInPeriod",
    });
    return 0;
  }
}

export async function getPostsWithImages(options: {
  locationId?: string | null;
  locationIds?: string[];
  city?: string;
  neighborhood?: string;
  state?: string;
  limit?: number;
}): Promise<Array<{
  id: string;
  image_url: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
}>> {
  try {
    let query = (supabase as any)
      .from("posts")
      .select(
        `
          id,
          image_url,
          content,
          created_at,
          author_profile:profiles!author_profile_id(display_name, avatar_url)
        `,
      )
      .eq("is_published", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 12);

    if (options.locationId) {
      query = query.eq("location_id", options.locationId);
    } else if (options.locationIds?.length) {
      query = query.in("location_id", options.locationIds);
    } else if (options.city && options.state) {
      const cityResolution = await resolveCityToLocationIds(options.state, options.city);
      if (cityResolution?.districtIds?.length) {
        if (options.neighborhood) {
          const neighborhoodId = await resolveNeighborhoodInCity(
            options.state,
            options.city,
            options.neighborhood,
          );
          if (neighborhoodId) {
            query = query.eq("location_id", neighborhoodId);
          } else {
            return [];
          }
        } else {
          query = query.in("location_id", cityResolution.districtIds);
        }
      } else {
        return [];
      }
    } else if (options.city || options.neighborhood) {
      return [];
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return mapPostsWithImagesRows(data as Array<{
      id: string;
      image_url: string;
      content?: string | null;
      created_at: string;
      author_profile?: {
        display_name?: string | null;
        avatar_url?: string | null;
      } | null;
    }>);
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsWithImages",
    });
    return [];
  }
}

