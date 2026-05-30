import { SessionService } from "@/core/session/services/SessionService";
import { NotificationService } from "@/core/notifications/services/NotificationService";
import { postService } from "@/core/posts/services";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import type {
  WorkOpportunityCard,
  WorkOpportunityDetail,
  WorkOpportunityProfessionalDetail,
  WorkOpportunityRecentItem,
  OwnedProfessionalProfileSummary,
  WorkOpportunity,
  WorkOpportunityCreateInput,
  WorkOpportunityFilters,
  WorkOpportunityType,
} from "../types";
import { WORK_OPPORTUNITY_STATUS } from "../constants/statuses";

const DEFAULT_DISTRIBUTION_CHANNELS = ["oportunidades", "moradores", "para_voce", "todos"];

interface ProfessionalMatchCandidate {
  professional_id: string;
  owner_user_id: string | null;
  professional_name: string | null;
  service_category: string | null;
}

interface StructuredVagaMatchingInput {
  vagaId: string;
  title: string;
  professionalCategory: string;
  territoryLocationId: string;
  sourceUrl: string;
  actorUserId?: string | null;
}

interface ProfessionalDataDetailRow {
  id: string;
  slug: string | null;
  professional_name: string | null;
  service_category: string | null;
  description: string | null;
  availability_notes: string | null;
  is_accepting_clients: boolean | null;
  visibility: "public_listed" | "public_unlisted" | "private" | null;
  rating: number | null;
  portfolio_items: Array<{
    url?: string;
    caption?: string;
    media_type?: "image" | "video" | "document";
    is_cover?: boolean;
  }> | null;
  metadata: Record<string, unknown> | null;
  location: { geographic_path: string | null } | null;
}

class WorkOpportunitiesServiceClass {
  private static readonly SLOW_OPERATION_THRESHOLD_MS = 500;

  private nowMs(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  private logSlowOperation(scope: string, startedAt: number, metadata?: Record<string, unknown>): void {
    const elapsed = this.nowMs() - startedAt;
    if (elapsed < WorkOpportunitiesServiceClass.SLOW_OPERATION_THRESHOLD_MS) return;
    logger.warn(`[WorkOpportunitiesService] Slow ${scope}: ${Math.round(elapsed)}ms`, metadata);
  }

  private readonly lifecycleHoursByType: Record<WorkOpportunityType, number> = {
    looking_for_work: 14 * 24,
    offering_work: 7 * 24,
    freelance: 72,
    quick_job: 24,
    service_availability: 96,
  };

  private getPublishedDate(card: Pick<WorkOpportunityCard, "published_at" | "created_at">): Date {
    return new Date(card.published_at ?? card.created_at);
  }

  private computeLifecycleState(
    card: Pick<WorkOpportunityCard, "status" | "opportunity_type" | "published_at" | "created_at">,
  ): { state: "active" | "expiring_soon" | "expired" | "resolved"; isRecent: boolean; hoursSince: number; estimatedExpiresAt: string } {
    const publishedAt = this.getPublishedDate(card);
    const hoursSince = Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5);
    const lifecycleHours = this.lifecycleHoursByType[card.opportunity_type] ?? 72;
    const expiresAt = new Date(publishedAt.getTime() + lifecycleHours * 36e5).toISOString();

    if (card.status === "filled" || card.status === "cancelled") {
      return { state: "resolved", isRecent: hoursSince <= 48, hoursSince, estimatedExpiresAt: expiresAt };
    }
    if (card.status === "expired") {
      return { state: "expired", isRecent: false, hoursSince, estimatedExpiresAt: expiresAt };
    }
    if (hoursSince >= lifecycleHours) {
      return { state: "expired", isRecent: false, hoursSince, estimatedExpiresAt: expiresAt };
    }
    if (hoursSince >= lifecycleHours * 0.7) {
      return { state: "expiring_soon", isRecent: hoursSince <= 48, hoursSince, estimatedExpiresAt: expiresAt };
    }
    return { state: "active", isRecent: hoursSince <= 48, hoursSince, estimatedExpiresAt: expiresAt };
  }

  private computeQuality(
    card: Pick<WorkOpportunityCard, "territory_location_id" | "professional_name" | "availability_notes" | "published_at" | "created_at">,
    preferredTerritoryLocationId?: string,
  ): {
    score: number;
    factors: { proximity: number; reputation: number; availability: number; recency: number };
  } {
    const publishedAt = this.getPublishedDate(card);
    const hoursSince = Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5);
    const proximity = preferredTerritoryLocationId && card.territory_location_id === preferredTerritoryLocationId ? 40 : 18;
    const reputation = card.professional_name ? 24 : 12;
    const availability = card.availability_notes ? 20 : 8;
    const recency = Math.max(0, 22 - Math.floor(hoursSince / 6));

    return {
      score: proximity + reputation + availability + recency,
      factors: { proximity, reputation, availability, recency },
    };
  }

  private enrichAndRankOpportunityCards(
    cards: WorkOpportunityCard[],
    preferredTerritoryLocationId?: string,
  ): WorkOpportunityCard[] {
    const enriched = cards
      .map((card) => {
        const lifecycle = this.computeLifecycleState(card);
        const quality = this.computeQuality(card, preferredTerritoryLocationId);
        return {
          ...card,
          lifecycle_state: lifecycle.state,
          is_recent: lifecycle.isRecent,
          hours_since_publish: Number(lifecycle.hoursSince.toFixed(2)),
          expires_at_estimated: lifecycle.estimatedExpiresAt,
          quality_score: quality.score,
          quality_factors: quality.factors,
        } satisfies WorkOpportunityCard;
      })
      .filter((card) => card.lifecycle_state !== "expired");

    return enriched.sort((a, b) => {
      const scoreDelta = (b.quality_score ?? 0) - (a.quality_score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  private buildOpportunityPrefix(type: WorkOpportunityType): string {
    switch (type) {
      case "looking_for_work":
        return "Procuro trabalho";
      case "offering_work":
        return "Ofereço trabalho";
      case "freelance":
        return "Freela";
      case "quick_job":
        return "Diária rápida";
      case "service_availability":
        return "Disponível para serviços";
      default:
        return "Oportunidade";
    }
  }

  private buildFeedText(type: WorkOpportunityType, headline: string, category: string): string {
    const prefix = this.buildOpportunityPrefix(type);
    return `${prefix}: ${headline} (${category})`;
  }

  private getDistributionLevel(reach: "street" | "neighborhood" | "city"): "street" | "neighborhood" | "region" | "city" {
    if (reach === "street") return "street";
    if (reach === "city") return "city";
    return "neighborhood";
  }

  private async resolveLocationName(locationId: string): Promise<string | null> {
    const { data, error } = await (supabase as any)
      .from("locations")
      .select("name")
      .eq("id", locationId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { name: string | null }).name ?? null;
  }

  private extractPortfolioImages(raw: ProfessionalDataDetailRow | null): string[] {
    if (!raw) return [];

    const metadataImages = Array.isArray(raw.metadata?.portfolio_images)
      ? raw.metadata?.portfolio_images.filter((item): item is string => typeof item === "string")
      : [];

    const itemImages = Array.isArray(raw.portfolio_items)
      ? raw.portfolio_items
          .map((item) => item?.url)
          .filter((url): url is string => typeof url === "string" && url.length > 0)
      : [];

    return Array.from(new Set([...metadataImages, ...itemImages]));
  }

  private getTotalReviews(raw: ProfessionalDataDetailRow | null): number {
    if (!raw?.metadata || typeof raw.metadata !== "object") return 0;

    const totalReviews = raw.metadata.total_reviews;
    if (typeof totalReviews === "number") return totalReviews;
    if (typeof totalReviews === "string") {
      const parsed = Number.parseInt(totalReviews, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  async listMyProfessionalProfiles(): Promise<OwnedProfessionalProfileSummary[]> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("professional_data")
        .select("id, professional_name, service_category, location_id, is_accepting_clients, visibility, slug")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("WorkOpportunitiesService.listMyProfessionalProfiles", error);
        return [];
      }

      return (data ?? []) as OwnedProfessionalProfileSummary[];
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "listMyProfessionalProfiles",
      });
      return [];
    }
  }

  async createOpportunity(input: WorkOpportunityCreateInput): Promise<WorkOpportunity> {
    const trimmedTitle = input.title.trim();
    const trimmedDescription = input.description.trim();
    const trimmedCategory = input.professionalCategory.trim().toLowerCase();

    if (!trimmedTitle || !trimmedDescription || !trimmedCategory) {
      throw new Error("Campos obrigatórios da oportunidade não preenchidos.");
    }

    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado.");

      if (input.professionalId) {
        const { data: linkedProfessional, error: linkedProfessionalError } = await (supabase as any)
          .from("professional_data")
          .select("id, owner_user_id")
          .eq("id", input.professionalId)
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (linkedProfessionalError) {
          throw new Error(linkedProfessionalError.message);
        }

        if (!linkedProfessional) {
          throw new Error("Perfil profissional vinculado não pertence ao usuário atual.");
        }
      }

      const { data: createdOpportunity, error: createError } = await (supabase as any)
        .from("work_opportunities")
        .insert({
          author_profile_id: input.authorProfileId,
          professional_id: input.professionalId ?? null,
          opportunity_type: input.opportunityType,
          headline: trimmedTitle,
          description: trimmedDescription,
          professional_category: trimmedCategory,
          territory_location_id: input.territoryLocationId,
          reach: input.reach ?? "neighborhood",
          urgency: input.urgency,
          availability_notes: input.availabilityNotes?.trim() || null,
          compensation_notes: input.compensationNotes?.trim() || null,
          contact_notes: input.contactNotes?.trim() || null,
          visibility: input.visibility ?? "public_listed",
          status: WORK_OPPORTUNITY_STATUS.ACTIVE,
          is_feed_distributed: true,
          matching_metadata: {
            schema_version: "work-opportunity.v1",
            matching_keys: {
              category: trimmedCategory,
              territory_location_id: input.territoryLocationId,
              urgency: input.urgency,
            },
          },
          source_context: input.sourceContext ?? "community_feed",
        })
        .select("*")
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      const opportunity = createdOpportunity as WorkOpportunity;

      const distributionChannels =
        input.distributionChannels && input.distributionChannels.length > 0
          ? input.distributionChannels
          : DEFAULT_DISTRIBUTION_CHANNELS;

      const territoryName = await this.resolveLocationName(opportunity.territory_location_id);

      const postPayload = {
        schema_version: "territorial-content.v3",
        intent: "oportunidade",
        structural_type: "favor",
        display_format: "opportunity_card",
        distribution_territorial: {
          level: this.getDistributionLevel(opportunity.reach),
          channels: distributionChannels,
        },
        opportunity: {
          id: opportunity.id,
          type: opportunity.opportunity_type,
          headline: opportunity.headline,
          description: opportunity.description,
          professional_id: opportunity.professional_id,
          professional_category: opportunity.professional_category,
          territory_location_id: opportunity.territory_location_id,
          territory_name: territoryName,
          urgency: opportunity.urgency,
          availability_notes: opportunity.availability_notes,
          compensation_notes: opportunity.compensation_notes,
          contact_notes: opportunity.contact_notes,
          visibility: opportunity.visibility,
          status: opportunity.status,
        },
      } as const;

      const createdPost = await postService.createPost({
        author_profile_id: input.authorProfileId,
        content: this.buildFeedText(
          opportunity.opportunity_type,
          opportunity.headline,
          opportunity.professional_category,
        ),
        type: "favor",
        location_id: input.territoryLocationId,
        reach: opportunity.reach,
        tags: [
          "format:opportunity",
          "intent:oportunidade",
          `opportunity:type:${opportunity.opportunity_type}`,
          `opportunity:urgency:${opportunity.urgency}`,
          `category:${opportunity.professional_category}`,
        ],
        content_intent: "oportunidade",
        display_format: "opportunity_card",
        distribution_channels: distributionChannels,
        content_payload: postPayload as unknown as Record<string, unknown>,
      });

      const { data: updatedOpportunity, error: updateError } = await (supabase as any)
        .from("work_opportunities")
        .update({
          post_id: createdPost.id,
          published_at: new Date().toISOString(),
        })
        .eq("id", opportunity.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const completedOpportunity = updatedOpportunity as WorkOpportunity;

      this.notifyMatchingProfessionals(completedOpportunity).catch((notificationError) => {
        logger.error("WorkOpportunitiesService.notifyMatchingProfessionals", notificationError);
      });

      return completedOpportunity;
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "createOpportunity",
        metadata: {
          authorProfileId: input.authorProfileId,
          opportunityType: input.opportunityType,
        },
      });
      throw error;
    }
  }

  async listPublicOpportunities(filters: WorkOpportunityFilters = {}): Promise<WorkOpportunity[]> {
    try {
      let query = (supabase as any)
        .from("work_opportunities")
        .select("*")
        .eq("status", "active")
        .eq("visibility", filters.visibility ?? "public_listed")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 30);

      if (filters.territoryLocationId) {
        query = query.eq("territory_location_id", filters.territoryLocationId);
      }

      if (filters.professionalCategory) {
        query = query.eq("professional_category", filters.professionalCategory.trim().toLowerCase());
      }

      if (filters.opportunityType) {
        query = query.eq("opportunity_type", filters.opportunityType);
      }

      if (filters.urgency) {
        query = query.eq("urgency", filters.urgency);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as WorkOpportunity[];
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "listPublicOpportunities",
      });
      return [];
    }
  }

  async listPublicOpportunityCards(filters: WorkOpportunityFilters = {}): Promise<WorkOpportunityCard[]> {
    const startedAt = this.nowMs();
    try {
      let query = (supabase as any)
        .from("public_work_opportunity_search")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 40);

      if (filters.territoryLocationId) {
        query = query.eq("territory_location_id", filters.territoryLocationId);
      }

      if (filters.professionalCategory) {
        query = query.eq("professional_category", filters.professionalCategory.trim().toLowerCase());
      }

      if (filters.opportunityType) {
        query = query.eq("opportunity_type", filters.opportunityType);
      }

      if (filters.urgency) {
        query = query.eq("urgency", filters.urgency);
      }

      if (filters.territory) {
        const territoryTerm = sanitizeForILike(filters.territory);
        if (territoryTerm) {
          query = query.ilike("territory_name", `%${territoryTerm}%`);
        }
      }

      if (filters.availability) {
        const availabilityTerm = sanitizeForILike(filters.availability);
        if (availabilityTerm) {
          query = query.ilike("availability_notes", `%${availabilityTerm}%`);
        }
      }

      if (filters.search) {
        const searchTerm = sanitizeForILike(filters.search);
        if (searchTerm) {
          query = query.or(
            [
              `headline.ilike.%${searchTerm}%`,
              `description.ilike.%${searchTerm}%`,
              `professional_category.ilike.%${searchTerm}%`,
              `territory_name.ilike.%${searchTerm}%`,
              `professional_name.ilike.%${searchTerm}%`,
              `service_category.ilike.%${searchTerm}%`,
              `availability_notes.ilike.%${searchTerm}%`,
            ].join(","),
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return this.enrichAndRankOpportunityCards(
        (data ?? []) as WorkOpportunityCard[],
        filters.territoryLocationId,
      );
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "listPublicOpportunityCards",
      });
      return [];
    } finally {
      this.logSlowOperation("listPublicOpportunityCards", startedAt, {
        hasSearch: Boolean(filters.search),
        hasTerritory: Boolean(filters.territoryLocationId || filters.territory),
        hasCategory: Boolean(filters.professionalCategory),
        limit: filters.limit ?? 40,
      });
    }
  }

  async markOpportunityAsResolved(opportunityId: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("work_opportunities")
        .update({
          status: "filled",
          closed_at: new Date().toISOString(),
        })
        .eq("id", opportunityId);

      return !error;
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "markOpportunityAsResolved",
        metadata: { opportunityId },
      });
      return false;
    }
  }

  async expireStaleOpportunities(): Promise<{ expiredCount: number; expiredIds: string[] }> {
    try {
      const { data, error } = await (supabase as any).rpc("expire_stale_work_opportunities");
      if (error) {
        throw new Error(error.message);
      }

      const row = Array.isArray(data) ? data[0] : data;
      return {
        expiredCount: Number(row?.expired_count ?? 0),
        expiredIds: Array.isArray(row?.expired_ids) ? row.expired_ids : [],
      };
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "expireStaleOpportunities",
      });
      return { expiredCount: 0, expiredIds: [] };
    }
  }

  async getPublicOpportunityDetail(opportunityId: string): Promise<WorkOpportunityDetail | null> {
    const startedAt = this.nowMs();
    try {
      const { data: baseData, error: baseError } = await (supabase as any)
        .from("public_work_opportunity_search")
        .select("*")
        .eq("id", opportunityId)
        .maybeSingle();

      if (baseError) {
        throw new Error(baseError.message);
      }

      if (!baseData) {
        return null;
      }

      const base = this.enrichAndRankOpportunityCards([baseData as WorkOpportunityCard])[0] ?? (baseData as WorkOpportunityCard);

      let professional: WorkOpportunityProfessionalDetail | null = null;
      if (base.professional_id) {
        const { data: professionalData, error: professionalError } = await (supabase as any)
          .from("professional_data")
          .select(
            `
            id,
            slug,
            professional_name,
            service_category,
            description,
            availability_notes,
            is_accepting_clients,
            visibility,
            rating,
            portfolio_items,
            metadata,
            location:locations!professional_data_location_id_fkey(
              geographic_path
            )
          `,
          )
          .eq("id", base.professional_id)
          .maybeSingle();

        if (professionalError) {
          logger.warn("WorkOpportunitiesService.getPublicOpportunityDetail.professional", professionalError);
        } else if (professionalData) {
          const rawProfessional = professionalData as ProfessionalDataDetailRow;
          professional = {
            id: rawProfessional.id,
            slug: rawProfessional.slug,
            public_url: ProfessionalUrlService.getCanonicalUrlFromTarget({
              id: rawProfessional.id,
              slug: rawProfessional.slug,
              geographic_path: rawProfessional.location?.geographic_path,
            }),
            professional_name: rawProfessional.professional_name,
            service_category: rawProfessional.service_category,
            description: rawProfessional.description,
            availability_notes: rawProfessional.availability_notes,
            is_accepting_clients: rawProfessional.is_accepting_clients ?? false,
            visibility: rawProfessional.visibility ?? "public_listed",
            rating: rawProfessional.rating,
            total_reviews: this.getTotalReviews(rawProfessional),
            portfolio_images: this.extractPortfolioImages(rawProfessional),
            portfolio_items: (rawProfessional.portfolio_items ?? []).filter(
              (item): item is { url: string; caption?: string; media_type?: "image" | "video" | "document"; is_cover?: boolean } =>
                Boolean(item?.url),
            ).map((item) => ({ ...item, url: item.url as string })),
          };
        }
      }

      const recentOpportunities = await this.listRecentOpportunitiesByAuthorProfile(base.author_profile_id, 4);

      return {
        ...base,
        professional,
        recent_opportunities: recentOpportunities.filter((item) => item.id !== base.id).slice(0, 3),
      };
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "getPublicOpportunityDetail",
        metadata: { opportunityId },
      });
      return null;
    } finally {
      this.logSlowOperation("getPublicOpportunityDetail", startedAt, {
        opportunityId,
      });
    }
  }

  async listRecentOpportunitiesByAuthorProfile(
    authorProfileId: string,
    limit = 6,
  ): Promise<WorkOpportunityRecentItem[]> {
    const startedAt = this.nowMs();
    try {
      const { data, error } = await (supabase as any)
        .from("work_opportunities")
        .select(
          "id, professional_id, professional_category, headline, opportunity_type, urgency, status, visibility, availability_notes, territory_location_id, created_at, published_at",
        )
        .eq("author_profile_id", authorProfileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      const rows = (data ?? []) as Array<{
        id: string;
        professional_id: string | null;
        professional_category: string;
        headline: string;
        opportunity_type: WorkOpportunityType;
        urgency: WorkOpportunity["urgency"];
        status: WorkOpportunity["status"];
        visibility: WorkOpportunity["visibility"];
        availability_notes: string | null;
        territory_location_id: string;
        created_at: string;
        published_at: string | null;
      }>;

      if (rows.length === 0) return [];

      const locationIds = Array.from(new Set(rows.map((row) => row.territory_location_id).filter(Boolean)));
      const professionalIds = Array.from(new Set(rows.map((row) => row.professional_id).filter(Boolean))) as string[];

      const [locationsResult, professionalsResult] = await Promise.all([
        locationIds.length > 0
          ? (supabase as any).from("locations").select("id, name").in("id", locationIds)
          : Promise.resolve({ data: [], error: null }),
        professionalIds.length > 0
          ? (supabase as any)
              .from("professional_data")
              .select("id, professional_name, service_category")
              .in("id", professionalIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (locationsResult.error) {
        logger.warn("WorkOpportunitiesService.listRecentOpportunitiesByAuthorProfile.locations", locationsResult.error);
      }

      if (professionalsResult.error) {
        logger.warn("WorkOpportunitiesService.listRecentOpportunitiesByAuthorProfile.professionals", professionalsResult.error);
      }

      const locationMap = new Map<string, string | null>(
        ((locationsResult.data ?? []) as Array<{ id: string; name: string | null }>).map((item) => [
          item.id,
          item.name,
        ]),
      );

      const professionalMap = new Map<string, { professional_name: string | null; service_category: string | null }>(
        ((professionalsResult.data ?? []) as Array<{
          id: string;
          professional_name: string | null;
          service_category: string | null;
        }>).map((item) => [
          item.id,
          {
            professional_name: item.professional_name,
            service_category: item.service_category,
          },
        ]),
      );

      return rows.map((row) => {
        const linkedProfessional = row.professional_id ? professionalMap.get(row.professional_id) : null;
        return {
          id: row.id,
          professional_id: row.professional_id,
          professional_name: linkedProfessional?.professional_name ?? null,
          professional_category: linkedProfessional?.service_category ?? row.professional_category,
          headline: row.headline,
          opportunity_type: row.opportunity_type,
          urgency: row.urgency,
          status: row.status,
          visibility: row.visibility,
          availability_notes: row.availability_notes,
          territory_location_id: row.territory_location_id,
          territory_name: locationMap.get(row.territory_location_id) ?? null,
          created_at: row.created_at,
          published_at: row.published_at,
        } satisfies WorkOpportunityRecentItem;
      });
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "listRecentOpportunitiesByAuthorProfile",
        metadata: { authorProfileId },
      });
      return [];
    } finally {
      this.logSlowOperation("listRecentOpportunitiesByAuthorProfile", startedAt, {
        authorProfileId,
        limit,
      });
    }
  }

  async getOpportunityByPostId(postId: string): Promise<WorkOpportunity | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("work_opportunities")
        .select("*")
        .eq("post_id", postId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return (data as WorkOpportunity | null) ?? null;
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "getOpportunityByPostId",
      });
      return null;
    }
  }

  private async notifyMatchingProfessionals(opportunity: WorkOpportunity): Promise<void> {
    const shouldNotify = ["offering_work", "freelance", "quick_job"].includes(opportunity.opportunity_type);
    if (!shouldNotify) return;

    const { data: candidates, error } = await (supabase as any)
      .from("professional_data")
      .select("id, owner_user_id, professional_name, service_category")
      .eq("service_category", opportunity.professional_category)
      .eq("location_id", opportunity.territory_location_id)
      .eq("is_accepting_clients", true)
      .in("visibility", ["public_listed", "public_unlisted"])
      .neq("owner_user_id", opportunity.author_user_id)
      .limit(30);

    if (error || !candidates) {
      if (error) {
        logger.error("WorkOpportunitiesService.notifyMatchingProfessionals.query", error);
      }
      return;
    }

    const list = candidates as ProfessionalMatchCandidate[];
    const notifications = list
      .filter((candidate) => !!candidate.owner_user_id)
      .map((candidate) =>
        NotificationService.createNotification({
          user_id: candidate.owner_user_id as string,
          type: "info",
          category: "transactional",
          title: `Nova oportunidade para ${opportunity.professional_category}`,
          message: `${opportunity.headline} na sua regiao.`,
          action_url: `/oportunidades/${opportunity.id}`,
          action_label: "Ver oportunidade",
          metadata: {
            domain: "work_opportunities",
            opportunity_id: opportunity.id,
            professional_id: candidate.professional_id,
            opportunity_type: opportunity.opportunity_type,
          },
        }),
      );

    if (notifications.length === 0) return;
    await Promise.allSettled(notifications);
  }

  async notifyMatchingForStructuredVaga(input: StructuredVagaMatchingInput): Promise<void> {
    const normalizedCategory = input.professionalCategory.trim().toLowerCase();
    if (!normalizedCategory) return;

    const { data: candidates, error } = await (supabase as any)
      .from("professional_data")
      .select("id, owner_user_id, professional_name, service_category")
      .eq("service_category", normalizedCategory)
      .eq("location_id", input.territoryLocationId)
      .eq("is_accepting_clients", true)
      .in("visibility", ["public_listed", "public_unlisted"])
      .neq("owner_user_id", input.actorUserId ?? "")
      .limit(30);

    if (error || !candidates) {
      if (error) {
        logger.error("WorkOpportunitiesService.notifyMatchingForStructuredVaga.query", error);
      }
      return;
    }

    const list = candidates as ProfessionalMatchCandidate[];
    const notifications = list
      .filter((candidate) => !!candidate.owner_user_id)
      .map((candidate) =>
        NotificationService.createNotification({
          user_id: candidate.owner_user_id as string,
          type: "info",
          category: "transactional",
          title: `Nova vaga para ${normalizedCategory}`,
          message: `${input.title} na sua regiao.`,
          action_url: input.sourceUrl,
          action_label: "Ver vaga",
          metadata: {
            domain: "vagas",
            vaga_id: input.vagaId,
            matched_category: normalizedCategory,
            territory_location_id: input.territoryLocationId,
          },
        }),
      );

    if (notifications.length === 0) return;
    await Promise.allSettled(notifications);
  }
}

export const workOpportunitiesService = new WorkOpportunitiesServiceClass();
export { workOpportunitiesService as WorkOpportunitiesService };

