import { SessionService } from "@/core/session/services/SessionService";
import { postService } from "@/core/posts/services";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
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

type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
type ProfessionalDataRow = Database["public"]["Tables"]["professional_data"]["Row"];
type WorkOpportunityRow = Database["public"]["Tables"]["work_opportunities"]["Row"];
type WorkOpportunityInsert = Database["public"]["Tables"]["work_opportunities"]["Insert"];
type WorkOpportunityUpdate = Database["public"]["Tables"]["work_opportunities"]["Update"];
type PublicWorkOpportunitySearchRow =
  Database["public"]["Views"]["public_work_opportunity_search"]["Row"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (
    columns: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  neq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  ilike: (column: string, value: string) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface WorkOpportunitiesRpcClient {
  rpc: <TResult = unknown>(
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<QueryResult<TResult>>;
}

interface WorkOpportunitiesDbClient extends WorkOpportunitiesRpcClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type OwnedProfessionalProfileRow = Pick<
  ProfessionalDataRow,
  | "id"
  | "professional_name"
  | "service_category"
  | "location_id"
  | "is_accepting_clients"
  | "visibility"
  | "slug"
>;

type LinkedProfessionalOwnershipRow = Pick<ProfessionalDataRow, "id" | "profile_id">;

type RecentOpportunityRow = Pick<
  WorkOpportunityRow,
  | "id"
  | "professional_id"
  | "professional_category"
  | "headline"
  | "opportunity_type"
  | "urgency"
  | "status"
  | "visibility"
  | "availability_notes"
  | "territory_location_id"
  | "created_at"
  | "published_at"
>;

type ProfessionalListItemRow = Pick<
  ProfessionalDataRow,
  "id" | "professional_name" | "service_category"
>;

type OpportunityResolutionUpdate = Pick<WorkOpportunityUpdate, "status" | "closed_at">;

type PublicOpportunityCardRow = PublicWorkOpportunitySearchRow;

const workOpportunitiesDb = supabase as unknown as WorkOpportunitiesDbClient;

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

function toOwnedProfessionalProfileSummary(
  row: OwnedProfessionalProfileRow,
): OwnedProfessionalProfileSummary {
  return {
    id: row.id,
    professional_name: row.professional_name,
    service_category: row.service_category,
    location_id: row.location_id,
    is_accepting_clients: row.is_accepting_clients,
    visibility: row.visibility,
    slug: row.slug,
  };
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toProfessionalDataDetailRow(
  row: Pick<
    ProfessionalDataRow,
    | "id"
    | "slug"
    | "professional_name"
    | "service_category"
    | "description"
    | "availability_notes"
    | "is_accepting_clients"
    | "visibility"
    | "rating"
    | "portfolio_items"
    | "metadata"
  > & {
    location?: { geographic_path: string | null } | null;
  },
): ProfessionalDataDetailRow {
  const portfolioItems = Array.isArray(row.portfolio_items)
    ? (row.portfolio_items as ProfessionalDataDetailRow["portfolio_items"])
    : null;

  return {
    id: row.id,
    slug: row.slug,
    professional_name: row.professional_name,
    service_category: row.service_category,
    description: row.description,
    availability_notes: row.availability_notes,
    is_accepting_clients: row.is_accepting_clients,
    visibility: row.visibility,
    rating: row.rating,
    portfolio_items: portfolioItems,
    metadata: asObjectRecord(row.metadata),
    location: row.location ?? null,
  };
}

function toWorkOpportunity(row: WorkOpportunityRow): WorkOpportunity {
  return {
    id: row.id,
    author_profile_id: row.author_profile_id,
    author_user_id: row.author_user_id,
    professional_id: row.professional_id,
    opportunity_type: row.opportunity_type,
    headline: row.headline,
    description: row.description,
    professional_category: row.professional_category,
    territory_location_id: row.territory_location_id,
    reach: row.reach as WorkOpportunity["reach"],
    urgency: row.urgency as WorkOpportunity["urgency"],
    availability_notes: row.availability_notes,
    compensation_notes: row.compensation_notes,
    contact_notes: row.contact_notes,
    visibility: row.visibility as WorkOpportunity["visibility"],
    status: row.status as WorkOpportunity["status"],
    post_id: row.post_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    closed_at: row.closed_at,
  };
}

function toWorkOpportunityCard(row: PublicOpportunityCardRow): WorkOpportunityCard {
  return {
    id: row.id ?? "",
    author_profile_id: row.author_profile_id ?? "",
    author_name: row.author_name,
    author_avatar_url: row.author_avatar_url,
    professional_id: row.professional_id,
    opportunity_type: (row.opportunity_type ?? "looking_for_work") as WorkOpportunityType,
    headline: row.headline ?? "",
    description: row.description ?? "",
    professional_category: row.professional_category ?? "",
    territory_location_id: row.territory_location_id ?? "",
    territory_name: row.territory_name,
    urgency: (row.urgency ?? "flexivel") as WorkOpportunity["urgency"],
    availability_notes: row.availability_notes,
    compensation_notes: row.compensation_notes,
    contact_notes: row.contact_notes,
    visibility: (row.visibility ?? "public_listed") as WorkOpportunity["visibility"],
    status: (row.status ?? "active") as WorkOpportunity["status"],
    post_id: row.post_id,
    created_at: row.created_at ?? new Date(0).toISOString(),
    published_at: row.published_at,
    professional_slug: row.professional_slug,
    professional_name: row.professional_name,
    service_category: row.service_category,
  };
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

  private async getAccessibleProfileIds(userId: string): Promise<string[]> {
    const profiles = await profileService.getProfilesByUserId(userId);
    return [...new Set(profiles.map((profile) => profile.id).filter(Boolean))];
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
    const { data, error } = await workOpportunitiesDb
      .from<Pick<LocationRow, "name">>("locations")
      .select("name")
      .eq("id", locationId)
      .maybeSingle();

    if (error || !data) return null;
    return data.name ?? null;
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

      const accessibleProfileIds = await this.getAccessibleProfileIds(user.id);
      if (accessibleProfileIds.length === 0) return [];

      const { data, error } = await workOpportunitiesDb
        .from<OwnedProfessionalProfileRow>("professional_data")
        .select("id, professional_name, service_category, location_id, is_accepting_clients, visibility, slug")
        .in("profile_id", accessibleProfileIds)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("WorkOpportunitiesService.listMyProfessionalProfiles", error);
        return [];
      }

      return (data ?? []).map(toOwnedProfessionalProfileSummary);
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
        const accessibleProfileIds = await this.getAccessibleProfileIds(user.id);
        if (accessibleProfileIds.length === 0) {
          throw new Error("Perfil profissional vinculado nao pertence ao usuario atual.");
        }

        const { data: linkedProfessional, error: linkedProfessionalError } = await workOpportunitiesDb
          .from<LinkedProfessionalOwnershipRow>("professional_data")
          .select("id, profile_id")
          .eq("id", input.professionalId)
          .in("profile_id", accessibleProfileIds)
          .maybeSingle();

        if (linkedProfessionalError) {
          throw new Error(linkedProfessionalError.message);
        }

        if (!linkedProfessional) {
          throw new Error("Perfil profissional vinculado não pertence ao usuário atual.");
        }
      }

      const createPayload: WorkOpportunityInsert = {
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
        } as unknown as Json,
        source_context: input.sourceContext ?? "community_feed",
      };

      const { data: createdOpportunity, error: createError } = await workOpportunitiesDb
        .from<WorkOpportunityRow>("work_opportunities")
        .insert(createPayload)
        .select("*")
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      const opportunity = toWorkOpportunity(createdOpportunity);

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

      const updatePayload: Pick<WorkOpportunityUpdate, "post_id" | "published_at"> = {
        post_id: createdPost.id,
        published_at: new Date().toISOString(),
      };

      const { data: updatedOpportunity, error: updateError } = await workOpportunitiesDb
        .from<WorkOpportunityRow>("work_opportunities")
        .update(updatePayload)
        .eq("id", opportunity.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const completedOpportunity = toWorkOpportunity(updatedOpportunity);

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
      let query = workOpportunitiesDb
        .from<WorkOpportunityRow>("work_opportunities")
        .select("*")
        .eq("status", "active")
        .eq("visibility", filters.visibility ?? "public_listed")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 30);

      if (filters.territoryLocationIds?.length) {
        query = query.in("territory_location_id", [...filters.territoryLocationIds]);
      } else if (filters.territoryLocationId) {
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

      return (data ?? []).map(toWorkOpportunity);
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
      let query = workOpportunitiesDb
        .from<PublicOpportunityCardRow>("public_work_opportunity_search")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 40);

      if (filters.territoryLocationIds?.length) {
        query = query.in("territory_location_id", [...filters.territoryLocationIds]);
      } else if (filters.territoryLocationId) {
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
        (data ?? []).map(toWorkOpportunityCard),
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
        hasTerritory: Boolean(
          filters.territoryLocationIds?.length ||
          filters.territoryLocationId ||
          filters.territory,
        ),
        hasCategory: Boolean(filters.professionalCategory),
        limit: filters.limit ?? 40,
      });
    }
  }

  async markOpportunityAsResolved(opportunityId: string): Promise<boolean> {
    try {
      const resolutionPayload: OpportunityResolutionUpdate = {
        status: "filled",
        closed_at: new Date().toISOString(),
      };

      const { error } = await workOpportunitiesDb
        .from<WorkOpportunityRow>("work_opportunities")
        .update(resolutionPayload)
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

  async getPublicOpportunityDetail(opportunityId: string): Promise<WorkOpportunityDetail | null> {
    const startedAt = this.nowMs();
    try {
      const { data: baseData, error: baseError } = await workOpportunitiesDb
        .from<PublicOpportunityCardRow>("public_work_opportunity_search")
        .select("*")
        .eq("id", opportunityId)
        .maybeSingle();

      if (baseError) {
        throw new Error(baseError.message);
      }

      if (!baseData) {
        return null;
      }

      const normalizedBase = toWorkOpportunityCard(baseData);
      const base = this.enrichAndRankOpportunityCards([normalizedBase])[0] ?? normalizedBase;

      let professional: WorkOpportunityProfessionalDetail | null = null;
      if (base.professional_id) {
        const { data: professionalData, error: professionalError } = await workOpportunitiesDb
          .from<
            Pick<
              ProfessionalDataRow,
              | "id"
              | "slug"
              | "professional_name"
              | "service_category"
              | "description"
              | "availability_notes"
              | "is_accepting_clients"
              | "visibility"
              | "rating"
              | "portfolio_items"
              | "metadata"
            > & { location?: { geographic_path: string | null } | null }
          >("professional_data")
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
          const rawProfessional = toProfessionalDataDetailRow(professionalData);
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
      const { data, error } = await workOpportunitiesDb
        .from<RecentOpportunityRow>("work_opportunities")
        .select(
          "id, professional_id, professional_category, headline, opportunity_type, urgency, status, visibility, availability_notes, territory_location_id, created_at, published_at",
        )
        .eq("author_profile_id", authorProfileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      const rows = data ?? [];

      if (rows.length === 0) return [];

      const locationIds = Array.from(new Set(rows.map((row) => row.territory_location_id).filter(Boolean)));
      const professionalIds = Array.from(new Set(rows.map((row) => row.professional_id).filter(Boolean))) as string[];

      const [locationsResult, professionalsResult] = await Promise.all([
        locationIds.length > 0
          ? workOpportunitiesDb
              .from<Pick<LocationRow, "id" | "name">>("locations")
              .select("id, name")
              .in("id", locationIds)
          : Promise.resolve({ data: [], error: null }),
        professionalIds.length > 0
          ? workOpportunitiesDb
              .from<ProfessionalListItemRow>("professional_data")
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
        (locationsResult.data ?? []).map((item) => [
          item.id,
          item.name,
        ]),
      );

      const professionalMap = new Map<string, { professional_name: string | null; service_category: string | null }>(
        (professionalsResult.data ?? []).map((item) => [
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
          opportunity_type: row.opportunity_type as WorkOpportunityType,
          urgency: row.urgency as WorkOpportunity["urgency"],
          status: row.status as WorkOpportunity["status"],
          visibility: row.visibility as WorkOpportunity["visibility"],
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
      const { data, error } = await workOpportunitiesDb
        .from<WorkOpportunityRow>("work_opportunities")
        .select("*")
        .eq("post_id", postId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? toWorkOpportunity(data) : null;
    } catch (error) {
      trackError(error as Error, {
        component: "WorkOpportunitiesService",
        action: "getOpportunityByPostId",
      });
      return null;
    }
  }

}

export const workOpportunitiesService = new WorkOpportunitiesServiceClass();
export { workOpportunitiesService as WorkOpportunitiesService };

