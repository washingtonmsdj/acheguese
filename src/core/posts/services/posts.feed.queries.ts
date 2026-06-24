/**
 * POSTS TERRITORIAL FEED QUERIES - SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import type { FeedParams, FeedResult, Post } from "../types";
import { PostError } from "../types";
import { hasTechnicalSeedMarker } from "../utils/publicPostContent";

function encodeCursor(data: { created_at: string }): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function decodeCursor(cursor: string): { created_at: string } {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch {
    throw new PostError("Invalid cursor", "INVALID_CURSOR", 400);
  }
}

async function expandFeedLocationIds(locationIds: string[]): Promise<string[]> {
  const expanded: string[] = [];

  for (const locationId of locationIds) {
    const { data: location, error } = await supabase
      .from("locations")
      .select("id, type, parent_id")
      .eq("id", locationId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      logger.warn("[posts.queries] Failed to resolve feed location:", {
        location_id: locationId,
        error: error.message,
      });
      continue;
    }

    if (!location) {
      logger.warn("[posts.queries] Location not found or inactive:", {
        location_id: locationId,
      });
      continue;
    }

    expanded.push(locationId);

    if (location.type === "city") {
      const { data: districts } = await supabase
        .from("locations")
        .select("id")
        .eq("parent_id", locationId)
        .eq("type", "district")
        .eq("status", "active");

      if (districts) {
        expanded.push(...districts.map((district) => district.id));
      }
    } else if (location.type === "district" && location.parent_id) {
      expanded.push(location.parent_id);
    }
  }

  return [...new Set(expanded)];
}

async function resolveFeedLocationIds(params: {
  location_id?: string;
  location_ids?: string[];
  district_filter?: boolean;
  city_filter?: boolean;
}): Promise<string[]> {
  const { location_id, location_ids, district_filter, city_filter } = params;

  if (location_ids?.length) {
    return expandFeedLocationIds(location_ids);
  }

  if (!location_id) {
    return [];
  }

  if (district_filter) {
    return [location_id];
  }

  if (city_filter) {
    const { data: districts } = await supabase
      .from("locations")
      .select("id")
      .eq("parent_id", location_id)
      .eq("type", "district")
      .eq("status", "active");

    return [location_id, ...(districts ?? []).map((district) => district.id)];
  }

  return expandFeedLocationIds([location_id]);
}

export async function getTerritorialFeed(params: FeedParams = {}): Promise<FeedResult> {
  try {
    const {
      location_id,
      location_ids,
      district_filter = false,
      city_filter = false,
      includeStreetReach = false,
      limit = PAGINATION.DEFAULT_LIMIT,
      cursor,
    } = params;

    if (!location_id && !location_ids?.length) {
      logger.warn("[posts.queries] Empty feed locations:", { params });
      return { posts: [], hasMore: false };
    }

    const expandedIds = await resolveFeedLocationIds({
      location_id,
      location_ids,
      district_filter,
      city_filter,
    });

    if (expandedIds.length === 0) {
      logger.warn("[posts.queries] No valid locations after expansion:", {
        location_id,
        location_ids,
      });
      return { posts: [], hasMore: false };
    }

    let query = supabase
      .from("posts")
      .select(
        `
          id,
          author_profile_id,
          content,
          type,
          location_id,
          reach,
          images,
          tags,
          likes_count,
          comments_count,
          confirmations_count,
          is_verified,
          is_published,
          created_at,
          updated_at,
          author_profile:profiles!author_profile_id(
            id,
            name,
            avatar_url,
            verified
          ),
          location:locations(
            id,
            name,
            type,
            parent_id
          )
        `,
      )
      .in("location_id", expandedIds)
      .eq("is_published", true)
      .not("content", "ilike", "[MOCK%")
      .not("content", "ilike", "[SEED%")
      .not("content", "ilike", "[DEV%")
      .not("content", "ilike", "[TEST%")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (!includeStreetReach) {
      query = query.or("reach.is.null,reach.neq.street");
    }

    if (cursor) {
      query = query.lt("created_at", decodeCursor(cursor).created_at);
    }

    const { data: posts, error } = await query;

    if (error) {
      logger.error("[posts.queries] Feed query error:", {
        error: error.message,
        params,
      });
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    const rows = (posts ?? []).filter((post) => !hasTechnicalSeedMarker(post.content));
    const hasMore = rows.length > limit;
    const resultPosts = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && resultPosts.length > 0
        ? encodeCursor({ created_at: resultPosts[resultPosts.length - 1].created_at })
        : undefined;

    return {
      posts: resultPosts as Post[],
      nextCursor,
      hasMore,
    };
  } catch (error) {
    if (error instanceof PostError) throw error;
    logger.error("[posts.queries] Unexpected feed error:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getTerritorialFeed",
      metadata: { limit: params.limit },
    });
    throw new PostError("Unexpected error fetching feed", "UNKNOWN_ERROR");
  }
}

