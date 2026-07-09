import { applyTerritoryFilter } from "@/core/location";
import { supabase } from "@/integrations/supabase";
import type { Json } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import type {
  EventBoundsOptions,
  EventFilters,
  EventPageInput,
  EventPageOutput,
  EventRow,
  EventSortBy,
  EventSortOrder,
  PublicEvent,
  PublicEventCoordinateSource,
  PublicEventLocationType,
  PublicEventStatus,
} from "@/core/verticals/events/types";

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

type EventRowWithLegacyCity = EventRow & {
  city?: string | null;
};

const eventsDb = supabase as unknown as EventDbClient;
const DEFAULT_BOUNDS_STATUSES: readonly PublicEventStatus[] = ["upcoming", "ongoing"];
const EVENT_PAGE_MAX_SIZE = 50;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isPublicEventStatus(value: string | null | undefined): value is PublicEventStatus {
  return value === "upcoming" || value === "ongoing" || value === "completed" || value === "cancelled";
}

function toPublicEventStatus(value: string | null | undefined): PublicEventStatus {
  return isPublicEventStatus(value) ? value : "upcoming";
}

function toLocationType(value: string | null | undefined): PublicEventLocationType | null {
  if (value === "physical" || value === "online" || value === "hybrid") return value;
  return null;
}

function toCoordinateSource(value: string | null | undefined): PublicEventCoordinateSource | null {
  if (value === "exact" || value === "geocoded" || value === "approximate") return value;
  return null;
}

function toJsonArray(value: Json | null | undefined): Json[] | null {
  return Array.isArray(value) ? value : null;
}

function toJsonRecord(value: Json | null | undefined): Record<string, Json> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
}

function applyFilters<TRow>(query: EventQuery<TRow>, filters: EventFilters = {}): EventQuery<TRow> {
  let scopedQuery = query;

  if (filters.category) scopedQuery = scopedQuery.eq("category", filters.category);
  if (filters.status) scopedQuery = scopedQuery.eq("status", filters.status);
  if (filters.statuses?.length) scopedQuery = scopedQuery.in("status", [...filters.statuses]);
  if (filters.upcoming) scopedQuery = scopedQuery.gte("date", new Date().toISOString());
  if (filters.territoryFilter) scopedQuery = applyTerritoryFilter(scopedQuery, filters.territoryFilter);

  return scopedQuery;
}

function mapEventRow(row: EventRowWithLegacyCity): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    end_date: row.end_date,
    event_date: row.event_date,
    location: row.location ?? "",
    location_id: row.location_id,
    organizer_profile_id: row.organizer_profile_id,
    category: row.category ?? "comunitario",
    image_url: row.image_url,
    subtitle: row.subtitle,
    tags: row.tags,
    duration_minutes: row.duration_minutes,
    timezone: row.timezone,
    location_type: toLocationType(row.location_type),
    venue_name: row.venue_name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city ?? null,
    state: row.state,
    zipcode: row.zipcode,
    online_url: row.online_url,
    online_platform: row.online_platform,
    location_instructions: row.location_instructions,
    is_free: row.is_free,
    price: row.price,
    waitlist_enabled: row.waitlist_enabled,
    requirements: row.requirements,
    what_to_bring: row.what_to_bring,
    age_restriction: row.age_restriction,
    dress_code: row.dress_code,
    accessibility_info: row.accessibility_info,
    banner_image_url: row.banner_image_url,
    video_url: row.video_url,
    gallery: toJsonArray(row.gallery),
    schedule: toJsonArray(row.schedule),
    faq: toJsonArray(row.faq),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    meta_keywords: row.meta_keywords,
    features: toJsonRecord(row.features),
    organizer_contact: toJsonRecord(row.organizer_contact),
    published_at: row.published_at,
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    status: toPublicEventStatus(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at,
    latitude: row.latitude,
    longitude: row.longitude,
    coordinate_source: toCoordinateSource(row.coordinate_source),
  };
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
    const pageSize = Math.min(Math.max(input.pageSize ?? 12, 1), EVENT_PAGE_MAX_SIZE);
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
        .lte("longitude", east)
        .in("status", [...effectiveStatuses])
        .order("date", { ascending: true })
        .limit(limit);

      if (territoryFilter) query = applyTerritoryFilter(query, territoryFilter);

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
