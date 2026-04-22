import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { SourceType } from "../constants";

const supabaseAny = supabase as any;

export interface SourceBusinessDataSummary {
  id: string;
  profile_id: string | null;
  business_name: string | null;
  location_id: string | null;
  business_city: string | null;
}

export interface SourceProfileSummary {
  id: string;
  name: string | null;
  city: string | null;
  neighborhood: string | null;
  location_id: string | null;
}

export interface SourceLocationSummary {
  id: string;
  name: string | null;
  full_name: string | null;
  metadata: Record<string, unknown> | null;
}

export class MotoboySourceResolverService {
  static async resolveBusinessDataIdFromSource(
    sourceId: string,
  ): Promise<string | undefined> {
    const businessById = await this.getBusinessDataByBusinessId(sourceId);
    if (businessById?.id) return businessById.id;

    const businessByProfile = await this.getBusinessDataByProfileId(sourceId);
    if (businessByProfile?.id) return businessByProfile.id;

    const { data: gastronomyById, error: gastronomyByIdError } = await supabaseAny
      .from("gastronomy_profiles")
      .select("business_id")
      .eq("id", sourceId)
      .maybeSingle();
    if (gastronomyByIdError) {
      logger.warn("MotoboySourceResolverService.resolveBusinessDataIdFromSource.gastronomyById", gastronomyByIdError);
    }
    if (gastronomyById?.business_id) return gastronomyById.business_id;

    return undefined;
  }

  static async resolvePlanTier(
    sourceType: SourceType,
    sourceId: string,
  ): Promise<string | undefined> {
    if (sourceType !== "business" && sourceType !== "gastronomy") {
      return undefined;
    }

    const businessDataId = await this.resolveBusinessDataIdFromSource(sourceId);
    if (!businessDataId) {
      return undefined;
    }

    const { data: currentPlan, error: currentPlanError } = await supabaseAny
      .from("business_subscriptions")
      .select("plan_tier")
      .eq("business_id", businessDataId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentPlanError) {
      logger.warn("MotoboySourceResolverService.resolvePlanTier.businessSubscriptions", currentPlanError);
    } else if (currentPlan?.plan_tier) {
      return currentPlan.plan_tier;
    }

    const { data: legacyPlan, error: legacyPlanError } = await supabaseAny
      .from("gastronomy_subscriptions")
      .select("plan_tier")
      .eq("business_id", businessDataId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyPlanError) {
      logger.warn("MotoboySourceResolverService.resolvePlanTier.gastronomySubscriptions", legacyPlanError);
      return undefined;
    }

    return legacyPlan?.plan_tier;
  }

  static async resolveLocationIdFromSource(
    sourceId: string,
  ): Promise<string | undefined> {
    const profile = await this.getProfileSummaryById(sourceId);
    if (profile?.location_id) {
      return profile.location_id;
    }

    const businessDataId = await this.resolveBusinessDataIdFromSource(sourceId);
    if (!businessDataId) {
      return undefined;
    }

    const businessData = await this.getBusinessDataByBusinessId(businessDataId);
    return businessData?.location_id || undefined;
  }

  static async getProfileSummaryById(
    sourceId: string,
  ): Promise<SourceProfileSummary | null> {
    const { data, error } = await supabaseAny
      .from("profiles")
      .select("id, name, city, neighborhood, location_id")
      .eq("id", sourceId)
      .maybeSingle();

    if (error) {
      logger.warn("MotoboySourceResolverService.getProfileSummaryById", error);
      return null;
    }

    return (data as SourceProfileSummary | null) ?? null;
  }

  static async getBusinessDataFromSource(
    sourceId: string,
  ): Promise<SourceBusinessDataSummary | null> {
    const byBusinessId = await this.getBusinessDataByBusinessId(sourceId);
    if (byBusinessId) return byBusinessId;

    const byProfileId = await this.getBusinessDataByProfileId(sourceId);
    if (byProfileId) return byProfileId;

    const { data: byGastronomyProfileId, error: byGastronomyProfileIdError } = await supabaseAny
      .from("gastronomy_profiles")
      .select("business_id")
      .eq("id", sourceId)
      .maybeSingle();

    if (byGastronomyProfileIdError) {
      logger.warn("MotoboySourceResolverService.getBusinessDataFromSource.gastronomyProfile", byGastronomyProfileIdError);
      return null;
    }

    if (!byGastronomyProfileId?.business_id) {
      return null;
    }

    return this.getBusinessDataByBusinessId(byGastronomyProfileId.business_id);
  }

  static async getLocationSummaryById(
    locationId: string,
  ): Promise<SourceLocationSummary | null> {
    const { data, error } = await supabaseAny
      .from("locations")
      .select("id, name, full_name, metadata")
      .eq("id", locationId)
      .maybeSingle();

    if (error) {
      logger.warn("MotoboySourceResolverService.getLocationSummaryById", error);
      return null;
    }

    return (data as SourceLocationSummary | null) ?? null;
  }

  private static async getBusinessDataByBusinessId(
    businessId: string,
  ): Promise<SourceBusinessDataSummary | null> {
    const { data, error } = await supabaseAny
      .from("business_data")
      .select("id, profile_id, business_name, location_id, business_city")
      .eq("id", businessId)
      .maybeSingle();

    if (error) {
      logger.warn("MotoboySourceResolverService.getBusinessDataByBusinessId", error);
      return null;
    }

    return (data as SourceBusinessDataSummary | null) ?? null;
  }

  private static async getBusinessDataByProfileId(
    profileId: string,
  ): Promise<SourceBusinessDataSummary | null> {
    const { data, error } = await supabaseAny
      .from("business_data")
      .select("id, profile_id, business_name, location_id, business_city")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      logger.warn("MotoboySourceResolverService.getBusinessDataByProfileId", error);
      return null;
    }

    return (data as SourceBusinessDataSummary | null) ?? null;
  }
}
