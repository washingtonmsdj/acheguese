import { supabase } from "@/integrations/supabase";
import { AnalyticsService } from "@/core/analytics/AnalyticsService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { logger } from "@/shared/utils/logger";
import { resolveGastronomyBusinessId } from "./resolveGastronomyBusinessId";

export interface GastronomyQuickMetrics {
  totalViews: number;
  viewsThisWeek: number;
  totalReviews: number;
  avgRating: number;
  recentViews: { date: string; count: number }[];
}

export interface SimilarGastronomyBusiness {
  business_data_id: string;
  name: string;
  slug: string;
  banner_url: string | null;
  rating: number;
  total_reviews: number;
  cuisine_type: string;
  delivery_enabled: boolean;
  geographic_path: string | null;
}

export async function fetchGastronomyQuickMetrics(
  businessProfileId: string,
): Promise<GastronomyQuickMetrics> {
  const now = new Date();
  const weekAgoDate = new Date(now.getTime() - 7 * 86_400_000);
  const weekAgo = weekAgoDate.toISOString();
  const businessDataId = await resolveGastronomyBusinessId(businessProfileId);

  const reviewStatsPromise = ReviewsService.getReviewStats(
    businessProfileId,
    "business",
  ).catch((error) => {
    logger.error("[gastronomy-runtime] reviews error", error);
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  });

  const [totalMetrics, weekMetrics, dailyMetrics, reviewStats] = await Promise.all([
    AnalyticsService.getMetrics("business", businessDataId),
    AnalyticsService.getMetrics("business", businessDataId, weekAgo),
    AnalyticsService.getDailyMetrics(
      "business",
      businessDataId,
      weekAgo.slice(0, 10),
      now.toISOString().slice(0, 10),
    ),
    reviewStatsPromise,
  ]);

  if (totalMetrics.error) {
    logger.error("[gastronomy-runtime] total analytics error", totalMetrics.error);
  }
  if (weekMetrics.error) {
    logger.error("[gastronomy-runtime] weekly analytics error", weekMetrics.error);
  }
  if (dailyMetrics.error) {
    logger.error("[gastronomy-runtime] daily analytics error", dailyMetrics.error);
  }

  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    dayMap.set(day, 0);
  }

  for (const metric of dailyMetrics.data ?? []) {
    if (dayMap.has(metric.date)) {
      dayMap.set(metric.date, metric.total_views ?? 0);
    }
  }

  return {
    totalViews: totalMetrics.data?.total_views ?? 0,
    viewsThisWeek: weekMetrics.data?.total_views ?? 0,
    totalReviews: reviewStats.total,
    avgRating: Math.round(reviewStats.average * 10) / 10,
    recentViews: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
  };
}

export async function getBusinessCategoryByBusinessDataId(
  businessDataId: string,
): Promise<string | null> {
  const resolvedBusinessId = await resolveGastronomyBusinessId(businessDataId);
  const { data, error } = await supabase
    .from("business_data")
    .select("category")
    .eq("id", resolvedBusinessId)
    .single();

  if (error) {
    throw error;
  }

  return (data as { category?: string } | null)?.category ?? null;
}

export async function fetchSimilarGastronomyBusinesses(params: {
  businessDataId: string;
  cuisineType: string;
  limit?: number;
}): Promise<SimilarGastronomyBusiness[]> {
  const { businessDataId, cuisineType, limit = 5 } = params;

  try {
    const { data: profiles, error: profilesError } = await supabase
      .from("gastronomy_profiles")
      .select("business_id, cuisine_type, delivery_enabled")
      .eq("cuisine_type", cuisineType)
      .eq("status", "active")
      .neq("business_id", businessDataId)
      .limit(limit);

    if (profilesError || !profiles?.length) {
      return [];
    }

    const businessIds = profiles.map((profile) => profile.business_id);

    const { data: businesses, error: businessesError } = await supabase
      .from("business_data")
      .select(`
        id,
        business_name,
        slug,
        rating,
        total_reviews,
        location:locations!location_id(geographic_path)
      `)
      .in("id", businessIds)
      .eq("status", "active");

    if (businessesError || !businesses?.length) {
      return [];
    }

    const profilesMap = new Map(profiles.map((profile) => [profile.business_id, profile]));

    return businesses.map((business) => ({
      business_data_id: business.id as string,
      name: (business.business_name as string) || "",
      slug: (business.slug as string) || "",
      banner_url: null,
      rating: (business.rating as number) || 0,
      total_reviews: (business.total_reviews as number) || 0,
      cuisine_type: profilesMap.get(business.id as string)?.cuisine_type || cuisineType,
      delivery_enabled: profilesMap.get(business.id as string)?.delivery_enabled || false,
      geographic_path:
        (business.location as { geographic_path?: string } | null)?.geographic_path || null,
    }));
  } catch (error) {
    logger.error("[gastronomy-runtime] similar businesses error", error);
    return [];
  }
}
