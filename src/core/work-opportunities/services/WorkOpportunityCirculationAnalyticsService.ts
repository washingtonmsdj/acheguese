import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { WorkOpportunityType } from "../types";

type AnalyticsEventRow = Database["public"]["Tables"]["analytics_events"]["Row"];
type WorkOpportunityRow = Database["public"]["Tables"]["work_opportunities"]["Row"];
type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

type DiscoverySource = "feed" | "search" | "profile_professions" | "list" | "direct";

interface DashboardFilters {
  days?: number;
  territoryLocationId?: string;
  professionalCategory?: string;
  opportunityType?: WorkOpportunityType;
  source?: DiscoverySource;
}

interface FunnelMetrics {
  feed_to_detail_click_rate: number;
  detail_to_contact_rate: number;
  contact_to_positive_feedback_rate: number;
}

interface SegmentCount {
  key: string;
  value: number;
}

interface CirculationDashboardSnapshot {
  period_days: number;
  funnel: {
    feed_open: number;
    detail_view: number;
    contact_started: number;
    positive_feedback: number;
    rates: FunnelMetrics;
  };
  metrics: {
    opportunity_click_rate: number;
    contact_rate: number;
    positive_return_rate: number;
    response_rate: number;
    avg_minutes_until_contact: number;
    opportunities_without_response: number;
    active_users: number;
  };
  observability: {
    peak_hours: SegmentCount[];
    empty_or_low_supply_categories: SegmentCount[];
    demand_offer_gap_categories: Array<{
      category: string;
      demand: number;
      offer: number;
      gap: number;
    }>;
  };
  segments: {
    by_territory: SegmentCount[];
    by_profession: SegmentCount[];
    by_type: SegmentCount[];
    by_source: SegmentCount[];
    top_liquidity_categories: SegmentCount[];
    most_active_neighborhoods: SegmentCount[];
  };
}

function safeSource(raw: unknown): DiscoverySource {
  if (raw === "feed" || raw === "search" || raw === "profile_professions" || raw === "list" || raw === "direct") {
    return raw;
  }
  return "direct";
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function toNumberRate(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function increment(map: Map<string, number>, key: string | null | undefined): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToTop(map: Map<string, number>, limit = 8): SegmentCount[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

class WorkOpportunityCirculationAnalyticsServiceClass {
  async getDashboardSnapshot(filters: DashboardFilters = {}): Promise<CirculationDashboardSnapshot> {
    const days = Math.max(1, Math.min(90, filters.days ?? 30));
    const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    try {
      let eventsQuery = supabase
        .from("analytics_events")
        .select("entity_id, event_type, created_at, metadata")
        .eq("entity_type", "work_opportunity")
        .gte("created_at", sinceISO);

      if (filters.source) {
        eventsQuery = eventsQuery.eq("event_source", filters.source === "search" ? "search" : "web");
      }

      const [eventsResult, opportunitiesResult, locationsResult] = await Promise.all([
        eventsQuery,
        supabase
          .from("work_opportunities")
          .select("id, territory_location_id, professional_category, opportunity_type, created_at, published_at, status")
          .gte("created_at", sinceISO),
        supabase.from("locations").select("id, name"),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (opportunitiesResult.error) throw opportunitiesResult.error;

      const events = (eventsResult.data ?? []) as Pick<
        AnalyticsEventRow,
        "entity_id" | "event_type" | "created_at" | "metadata"
      >[];
      const opportunities = (opportunitiesResult.data ?? []) as Pick<
        WorkOpportunityRow,
        | "id"
        | "territory_location_id"
        | "professional_category"
        | "opportunity_type"
        | "created_at"
        | "published_at"
        | "status"
      >[];
      const locations = (locationsResult.data ?? []) as Pick<LocationRow, "id" | "name">[];

      const locationMap = new Map<string, string>(
        locations.filter((item) => Boolean(item.name)).map((item) => [item.id, item.name as string]),
      );

      const opportunityMap = new Map(opportunities.map((item) => [item.id, item]));
      const byTerritory = new Map<string, number>();
      const byProfession = new Map<string, number>();
      const byType = new Map<string, number>();
      const bySource = new Map<string, number>();
      const activeNeighborhoods = new Map<string, number>();

      let feedOpen = 0;
      let detailView = 0;
      let contactStarted = 0;
      let positiveFeedback = 0;
      let clickCount = 0;
      const activeUsers = new Set<string>();
      const byHour = new Map<string, number>();
      const demandByCategory = new Map<string, number>();
      const offerByCategory = new Map<string, number>();

      const firstOpenByOpportunity = new Map<string, number>();
      const firstContactByOpportunity = new Map<string, number>();
      const respondedOpportunities = new Set<string>();

      for (const event of events) {
        const metadata = asRecord(event.metadata);
        const eventName = typeof metadata.event_name === "string" ? metadata.event_name : "";
        const source = safeSource(metadata.source);
        const opportunityId = event.entity_id ?? (typeof metadata.opportunity_id === "string" ? metadata.opportunity_id : null);
        const relatedOpportunity = opportunityId ? opportunityMap.get(opportunityId) : undefined;
        if (typeof metadata.actor_profile_id === "string" && metadata.actor_profile_id) {
          activeUsers.add(metadata.actor_profile_id);
        }

        if (filters.territoryLocationId && relatedOpportunity?.territory_location_id !== filters.territoryLocationId) continue;
        if (filters.professionalCategory && relatedOpportunity?.professional_category !== filters.professionalCategory) continue;
        if (filters.opportunityType && relatedOpportunity?.opportunity_type !== filters.opportunityType) continue;
        if (filters.source && source !== filters.source) continue;

        increment(bySource, source);
        const eventHour = `${new Date(event.created_at).getHours()}:00`;
        increment(byHour, eventHour);
        if (relatedOpportunity) {
          increment(byProfession, relatedOpportunity.professional_category);
          increment(byType, relatedOpportunity.opportunity_type);
          const territoryName = locationMap.get(relatedOpportunity.territory_location_id) ?? relatedOpportunity.territory_location_id;
          increment(byTerritory, territoryName);
          increment(activeNeighborhoods, territoryName);
        }

        if (eventName === "work_opportunity_open" && source === "feed") feedOpen += 1;
        if (eventName === "work_opportunity_view") detailView += 1;
        if (eventName === "work_opportunity_click") clickCount += 1;
        if (eventName === "work_opportunity_contact_started") contactStarted += 1;
        if (eventName === "work_opportunity_feedback_loop") {
          const answer = typeof metadata.feedback_answer === "string" ? metadata.feedback_answer : "";
          if (answer === "helped" || answer === "found_someone" || answer === "service_done") {
            positiveFeedback += 1;
          }
        }

        if (opportunityId && eventName === "work_opportunity_open" && !firstOpenByOpportunity.has(opportunityId)) {
          firstOpenByOpportunity.set(opportunityId, Date.parse(event.created_at));
        }
        if (opportunityId && eventName === "work_opportunity_contact_started") {
          const existing = firstContactByOpportunity.get(opportunityId);
          const current = Date.parse(event.created_at);
          if (!existing || current < existing) {
            firstContactByOpportunity.set(opportunityId, current);
          }
          respondedOpportunities.add(opportunityId);
        }
      }

      const minutesToContact: number[] = [];
      for (const [opportunityId, openedAt] of firstOpenByOpportunity.entries()) {
        const contactedAt = firstContactByOpportunity.get(opportunityId);
        if (!contactedAt || Number.isNaN(openedAt) || Number.isNaN(contactedAt) || contactedAt < openedAt) continue;
        minutesToContact.push((contactedAt - openedAt) / 60000);
      }
      const avgMinutes = minutesToContact.length
        ? Number((minutesToContact.reduce((sum, value) => sum + value, 0) / minutesToContact.length).toFixed(2))
        : 0;

      const scopedOpportunities = opportunities.filter((item) => {
        if (filters.territoryLocationId && item.territory_location_id !== filters.territoryLocationId) return false;
        if (filters.professionalCategory && item.professional_category !== filters.professionalCategory) return false;
        if (filters.opportunityType && item.opportunity_type !== filters.opportunityType) return false;
        return true;
      });
      const opportunitiesWithoutResponse = scopedOpportunities.filter(
        (item) => !respondedOpportunities.has(item.id) && item.status === "active",
      ).length;
      for (const item of scopedOpportunities) {
        const category = item.professional_category || "sem_categoria";
        if (item.opportunity_type === "looking_for_work") {
          increment(demandByCategory, category);
        }
        if (
          item.opportunity_type === "offering_work" ||
          item.opportunity_type === "quick_job" ||
          item.opportunity_type === "freelance" ||
          item.opportunity_type === "service_availability"
        ) {
          increment(offerByCategory, category);
        }
      }

      const categoryKeys = new Set([...demandByCategory.keys(), ...offerByCategory.keys()]);
      const demandOfferGapCategories = [...categoryKeys]
        .map((category) => {
          const demand = demandByCategory.get(category) ?? 0;
          const offer = offerByCategory.get(category) ?? 0;
          return { category, demand, offer, gap: demand - offer };
        })
        .filter((item) => item.gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 8);
      const lowSupplyCategories = [...categoryKeys]
        .map((category) => ({ key: category, value: offerByCategory.get(category) ?? 0 }))
        .filter((item) => item.value <= 1)
        .sort((a, b) => a.value - b.value)
        .slice(0, 8);

      return {
        period_days: days,
        funnel: {
          feed_open: feedOpen,
          detail_view: detailView,
          contact_started: contactStarted,
          positive_feedback: positiveFeedback,
          rates: {
            feed_to_detail_click_rate: toNumberRate(detailView, feedOpen),
            detail_to_contact_rate: toNumberRate(contactStarted, detailView),
            contact_to_positive_feedback_rate: toNumberRate(positiveFeedback, contactStarted),
          },
        },
        metrics: {
          opportunity_click_rate: toNumberRate(clickCount, detailView || feedOpen),
          contact_rate: toNumberRate(contactStarted, detailView),
          positive_return_rate: toNumberRate(positiveFeedback, detailView),
          response_rate: toNumberRate(contactStarted, detailView),
          avg_minutes_until_contact: avgMinutes,
          opportunities_without_response: opportunitiesWithoutResponse,
          active_users: activeUsers.size,
        },
        observability: {
          peak_hours: mapToTop(byHour, 6),
          empty_or_low_supply_categories: lowSupplyCategories,
          demand_offer_gap_categories: demandOfferGapCategories,
        },
        segments: {
          by_territory: mapToTop(byTerritory),
          by_profession: mapToTop(byProfession),
          by_type: mapToTop(byType),
          by_source: mapToTop(bySource),
          top_liquidity_categories: mapToTop(byProfession),
          most_active_neighborhoods: mapToTop(activeNeighborhoods),
        },
      };
    } catch (error) {
      logger.error("WorkOpportunityCirculationAnalyticsService.getDashboardSnapshot", error as Error);
      return {
        period_days: days,
        funnel: {
          feed_open: 0,
          detail_view: 0,
          contact_started: 0,
          positive_feedback: 0,
          rates: {
            feed_to_detail_click_rate: 0,
            detail_to_contact_rate: 0,
            contact_to_positive_feedback_rate: 0,
          },
        },
        metrics: {
          opportunity_click_rate: 0,
          contact_rate: 0,
          positive_return_rate: 0,
          response_rate: 0,
          avg_minutes_until_contact: 0,
          opportunities_without_response: 0,
          active_users: 0,
        },
        observability: {
          peak_hours: [],
          empty_or_low_supply_categories: [],
          demand_offer_gap_categories: [],
        },
        segments: {
          by_territory: [],
          by_profession: [],
          by_type: [],
          by_source: [],
          top_liquidity_categories: [],
          most_active_neighborhoods: [],
        },
      };
    }
  }
}

export const workOpportunityCirculationAnalyticsService = new WorkOpportunityCirculationAnalyticsServiceClass();
export { workOpportunityCirculationAnalyticsService as WorkOpportunityCirculationAnalyticsService };
export type { CirculationDashboardSnapshot, DashboardFilters };
