import { applyTerritoryFilter } from "@/core/location";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import {
  mapEventRow,
  type EventRowWithLegacyCity,
} from "@/core/community-events/mappers";
import { EVENT_PAGE_SIZE } from "@/core/community-events/config/eventReadConfig";
import {
  PUBLIC_ACTIVE_EVENT_STATUSES,
  isEventCurrentOrFuture,
  isPublicActiveEventStatus,
} from "@/core/community-events/eventFreshness";
import type {
  EventBoundsOptions,
  EventFilters,
  EventPageInput,
  EventPageOutput,
  EventSortBy,
  EventSortOrder,
  PublicEvent,
  PublicEventStatus,
} from "@/core/community-events/types";

type ErrorLike = { message?: string | null } | null;

type EventQueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type EventSingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
};

type EventQuery<TRow> = PromiseLike<EventQueryPayload<TRow>> & {
  eq(column: string, value: unknown): EventQuery<TRow>;
  gte(column: string, value: unknown): EventQuery<TRow>;
  in(column: string, values: readonly unknown[]): EventQuery<TRow>;
  limit(value: number): EventQuery<TRow>;
  lte(column: string, value: unknown): EventQuery<TRow>;
  maybeSingle(): Promise<EventSingleQueryPayload<TRow>>;
  not(column: string, operator: string, value: unknown): EventQuery<TRow>;
  or(filter: string): EventQuery<TRow>;
  order(column: string, options?: { ascending?: boolean }): EventQuery<TRow>;
  range(from: number, to: number): EventQuery<TRow>;
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): EventQuery<TRow>;
};

type EventDbClient = {
  from<TRow>(table: string): EventQuery<TRow>;
};

const eventsDb = supabase as unknown as EventDbClient;
const DEFAULT_BOUNDS_STATUSES: readonly PublicEventStatus[] = ["upcoming", "ongoing"];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveActiveStatuses(
  filters: EventFilters,
): readonly PublicEventStatus[] | null {
  if (filters.status) {
    return isPublicActiveEventStatus(filters.status) ? [filters.status] : null;
  }

  if (filters.statuses?.length) {
    return filters.statuses.every(isPublicActiveEventStatus)
      ? [...new Set(filters.statuses)]
      : null;
  }

  return filters.upcoming ? PUBLIC_ACTIVE_EVENT_STATUSES : null;
}

function applyActiveStatusFreshness<TRow>(
  query: EventQuery<TRow>,
  statuses: readonly PublicEventStatus[],
  now = new Date(),
): EventQuery<TRow> {
  const nowIso = now.toISOString();
  const ongoingFloorIso = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const clauses: string[] = [];

  if (statuses.includes("upcoming")) {
    clauses.push(`and(status.eq.upcoming,date.gte.${nowIso})`);
  }

  if (statuses.includes("ongoing")) {
    clauses.push(
      `and(status.eq.ongoing,date.lte.${nowIso},end_date.gte.${nowIso})`,
      `and(status.eq.ongoing,date.lte.${nowIso},end_date.is.null,date.gte.${ongoingFloorIso})`,
    );
  }

  return clauses.length > 0 ? query.or(clauses.join(",")) : query;
}

function applyFilters<TRow>(
  query: EventQuery<TRow>,
  filters: EventFilters = {},
): EventQuery<TRow> {
  let scopedQuery = query;

  if (filters.category) {
    scopedQuery = scopedQuery.eq("category", filters.category);
  }
  if (filters.status) {
    scopedQuery = scopedQuery.eq("status", filters.status);
  }
  if (filters.statuses?.length) {
    scopedQuery = scopedQuery.in("status", [...filters.statuses]);
  }
  if (filters.upcoming && !filters.status && !filters.statuses?.length) {
    scopedQuery = scopedQuery.in("status", [...PUBLIC_ACTIVE_EVENT_STATUSES]);
  }

  const activeStatuses = resolveActiveStatuses(filters);
  if (activeStatuses) {
    scopedQuery = applyActiveStatusFreshness(scopedQuery, activeStatuses);
  }

  if (filters.territoryFilter) {
    scopedQuery = applyTerritoryFilter(
      scopedQuery,
      filters.territoryFilter,
    );
  }

  return scopedQuery;
}

export class EventReadService {
  async getEventById(id: string): Promise<PublicEvent | null> {
    if (!isUuid(id)) return null;

    try {
      const { data, error } = await eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapEventRow(data) : null;
    } catch (error) {
      logger.error("EventReadService.getEventById", error);
      return null;
    }
  }

  async getPublicEventById(id: string): Promise<PublicEvent | null> {
    const event = await this.getEventById(id);
    return event && isEventCurrentOrFuture(event) ? event : null;
  }

  async getEvents(filters: EventFilters = {}): Promise<PublicEvent[]> {
    try {
      let query = eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*")
        .order("date", { ascending: true });

      query = applyFilters(query, filters);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    } catch (error) {
      logger.error("EventReadService.getEvents", error);
      return [];
    }
  }

  async getEventsPage(input: EventPageInput = {}): Promise<EventPageOutput> {
    const page = Math.max(0, input.page ?? 0);
    const pageSize = Math.min(
      Math.max(input.pageSize ?? EVENT_PAGE_SIZE.DEFAULT, EVENT_PAGE_SIZE.MIN),
      EVENT_PAGE_SIZE.MAX,
    );
    const from = page * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*", { count: "exact" });

      query = applyFilters(query, input);

      if (input.search?.trim()) {
        const search = sanitizeForILike(input.search);
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
        }
      }

      const sortBy: EventSortBy = input.sortBy ?? "date";
      const sortOrder: EventSortOrder = input.sortOrder ?? "asc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const items = (data ?? []).map(mapEventRow);
      const totalCount = count ?? 0;
      const hasMore = from + items.length < totalCount;

      return {
        items,
        totalCount,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      };
    } catch (error) {
      logger.error("EventReadService.getEventsPage", error);
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextPage: null,
      };
    }
  }

  async getByBounds(
    bounds: [number, number, number, number],
    options: EventBoundsOptions = {},
  ): Promise<PublicEvent[]> {
    const [west, south, east, north] = bounds;
    const { limit = 200, statuses = DEFAULT_BOUNDS_STATUSES, territoryFilter } = options;
    const effectiveStatuses = statuses.length > 0 ? statuses : DEFAULT_BOUNDS_STATUSES;

    try {
      let query = eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east);

      query = applyFilters(query, {
        statuses: effectiveStatuses,
        territoryFilter,
      })
        .order("date", { ascending: true })
        .limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    } catch (error) {
      logger.error("EventReadService.getByBounds", error);
      return [];
    }
  }

  async getEventsByOrganizerProfile(profileId: string, limit = 20): Promise<PublicEvent[]> {
    try {
      const { data, error } = await eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*")
        .eq("organizer_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    } catch (error) {
      logger.error("EventReadService.getEventsByOrganizerProfile", error);
      return [];
    }
  }

  async getTotalEventsCount(): Promise<number> {
    try {
      const { count, error } = await eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("EventReadService.getTotalEventsCount", error);
      return 0;
    }
  }

  async getRecentEvents(limit = 10): Promise<PublicEvent[]> {
    try {
      const { data, error } = await eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapEventRow);
    } catch (error) {
      logger.error("EventReadService.getRecentEvents", error);
      return [];
    }
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const { count, error } = await eventsDb
        .from<EventRowWithLegacyCity>("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("EventReadService.getEventsCreatedInPeriod", error);
      return 0;
    }
  }
}

export const eventsReadService = new EventReadService();
