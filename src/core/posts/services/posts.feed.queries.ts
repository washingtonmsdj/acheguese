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
import {
  decodePostFeedCursor,
  encodePostFeedCursor,
  postFeedKeysetFilter,
} from "./postFeedCursor";

async function expandFeedLocationIds(locationIds: string[]): Promise<string[]> {
  const requestedIds = [...new Set(locationIds)].slice(0, 100);
  if (requestedIds.length === 0) return [];

  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, type, parent_id")
    .in("id", requestedIds)
    .eq("status", "active");

  if (error) {
    logger.warn("[posts.queries] Failed to resolve feed locations:", {
      location_count: requestedIds.length,
      error: error.message,
    });
    return [];
  }

  const expanded = new Set<string>();
  const cityIds: string[] = [];
  for (const location of locations ?? []) {
    expanded.add(location.id);
    if (location.type === "city") cityIds.push(location.id);
    if (location.type === "district" && location.parent_id) {
      expanded.add(location.parent_id);
    }
  }

  if (cityIds.length > 0) {
    const { data: districts, error: districtError } = await supabase
      .from("locations")
      .select("id")
      .in("parent_id", cityIds)
      .eq("type", "district")
      .eq("status", "active");

    if (districtError) {
      logger.warn("[posts.queries] Failed to expand city districts:", {
        city_count: cityIds.length,
        error: districtError.message,
      });
    } else {
      for (const district of districts ?? []) expanded.add(district.id);
    }
  }

  return [...expanded];
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

export async function getFeed(params: FeedParams = {}): Promise<FeedResult> {
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
    const normalizedLimit = Number.isFinite(limit)
      ? Math.min(50, Math.max(1, Math.trunc(limit)))
      : PAGINATION.DEFAULT_LIMIT;

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
      .eq("is_hidden", false)
      .eq("is_removed", false)
      .not("content", "ilike", "[MOCK%")
      .not("content", "ilike", "[SEED%")
      .not("content", "ilike", "[DEV%")
      .not("content", "ilike", "[TEST%")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(normalizedLimit + 1);

    if (!includeStreetReach) {
      query = query.or("reach.is.null,reach.neq.street");
    }

    if (cursor) {
      const decodedCursor = decodePostFeedCursor(cursor);
      const keysetFilter = postFeedKeysetFilter(decodedCursor);
      query = keysetFilter
        ? query.or(keysetFilter)
        : query.lt("created_at", decodedCursor.createdAt);
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
    const hasMore = rows.length > normalizedLimit;
    const resultPosts = hasMore ? rows.slice(0, normalizedLimit) : rows;
    const nextCursor =
      hasMore && resultPosts.length > 0
        ? encodePostFeedCursor({
            createdAt: resultPosts[resultPosts.length - 1].created_at,
            id: resultPosts[resultPosts.length - 1].id,
          })
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
      action: "getFeed",
      metadata: { limit: params.limit },
    });
    throw new PostError("Unexpected error fetching feed", "UNKNOWN_ERROR");
  }
}

