import { supabase } from "@/core/infrastructure/supabase";
import { logger } from "@/shared/utils/logger";

export interface GastronomyQuickMetrics {
  totalViews: number;
  viewsThisWeek: number;
  totalReviews: number;
  avgRating: number;
  recentViews: { date: string; count: number }[];
}

interface ViewRecord {
  viewed_at: string;
}

interface ReviewRecord {
  rating: number;
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
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const rpcClient = supabase as unknown as {
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };

  const [summaryRes, reviewsRes, viewsLast7Res] = await Promise.all([
    rpcClient.rpc("get_business_views_summary", {
      p_business_profile_id: businessProfileId,
      p_week_start: weekAgo,
    }),
    rpcClient.rpc("get_business_reviews", {
      p_business_profile_id: businessProfileId,
      p_limit: 500,
      p_offset: 0,
    }),
    rpcClient.rpc("get_business_views_last_7_days", {
      p_business_profile_id: businessProfileId,
      p_week_start: weekAgo,
    }),
  ]);

  if (summaryRes.error) logger.error("[gastronomy-runtime] views error", summaryRes.error);
  if (reviewsRes.error) logger.error("[gastronomy-runtime] reviews error", reviewsRes.error);

  const dayMap = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    dayMap.set(day, 0);
  }

  const viewsRows = Array.isArray(viewsLast7Res.data) ? (viewsLast7Res.data as ViewRecord[]) : [];
  viewsRows.forEach((view) => {
    const day = view.viewed_at?.slice(0, 10);
    if (day && dayMap.has(day)) {
      const currentCount = dayMap.get(day) ?? 0;
      dayMap.set(day, currentCount + 1);
    }
  });

  const reviews: ReviewRecord[] = Array.isArray(reviewsRes.data) ? (reviewsRes.data as ReviewRecord[]) : [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const summaryRows = Array.isArray(summaryRes.data)
    ? (summaryRes.data as Array<{ total_views?: number; views_this_week?: number }>)
    : [];
  const summary = summaryRows[0] ?? {};

  return {
    totalViews: summary.total_views ?? 0,
    viewsThisWeek: summary.views_this_week ?? 0,
    totalReviews: reviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
    recentViews: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
  };
}

export async function getBusinessCategoryByBusinessDataId(
  businessDataId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("business_data")
    .select("category")
    .eq("id", businessDataId)
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




