import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeILikePattern } from "@/shared/utils/sqlSanitization";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  ilike(column: string, pattern: string): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminEventsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const adminEventsDb = supabase as unknown as AdminEventsDbClient;

export interface AdminEventData {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  location_id?: string;
  organizer_profile_id: string;
  category: string;
  image_url?: string;
  max_participants?: number;
  current_participants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinate_source?: "exact" | "geocoded" | "approximate" | null;
  organizer_name?: string;
  organizer_avatar?: string;
  participant_count?: number;
}

export interface EventsStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export interface EventsListResult {
  data: AdminEventData[];
  total: number;
  page: number;
  totalPages: number;
}

type EventRow = Tables<"events">;
type EventParticipantRow = Tables<"event_participants">;
type EventStatusRow = Pick<EventRow, "status">;
type OrganizerSummaryRow = {
  name?: string | null;
  avatar_url?: string | null;
};
type EventListRow = EventRow & {
  organizer?: OrganizerSummaryRow | null;
};
type EventParticipantViewRow = Pick<EventParticipantRow, "profile_id"> & {
  profiles?: {
    id?: string | null;
    name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function mapAdminEvent(row: EventRow, organizer?: OrganizerSummaryRow | null): AdminEventData {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    date: row.date,
    location: row.location ?? "",
    location_id: row.location_id ?? undefined,
    organizer_profile_id: row.organizer_profile_id,
    category: row.category ?? "",
    image_url: row.image_url ?? undefined,
    max_participants: row.max_participants ?? undefined,
    current_participants: row.current_participants,
    status: row.status as AdminEventData["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    coordinate_source: row.coordinate_source as AdminEventData["coordinate_source"],
    organizer_name: organizer?.name ?? undefined,
    organizer_avatar: organizer?.avatar_url ?? undefined,
  };
}

class AdminEventsServiceClass {
  private readonly db = adminEventsDb;

  async getStats(): Promise<EventsStats> {
    try {
      const { data, error } = await this.db.from<EventStatusRow>("events").select("status");
      if (error) {
        logger.error("Error fetching events stats:", error);
        throw error;
      }

      const rows: EventStatusRow[] = data || [];
      return {
        total: rows.length,
        upcoming: rows.filter((event) => event.status === "upcoming").length,
        ongoing: rows.filter((event) => event.status === "ongoing").length,
        completed: rows.filter((event) => event.status === "completed").length,
        cancelled: rows.filter((event) => event.status === "cancelled").length,
      };
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  async getAllEvents(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<EventsListResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.db.from<EventListRow>("events").select(
        `
        *,
        organizer:profiles!organizer_profile_id (
          id,
          name,
          avatar_url
        ),
        locations(name, slug)
        `,
        { count: "exact" },
      );

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.search) {
        const searchPattern = buildSafeILikePattern(options.search);
        if (searchPattern) {
          query = query.ilike("title", searchPattern);
        }
      }

      query = query.order("date", { ascending: true }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) {
        logger.error("Error fetching events:", error);
        throw error;
      }

      const rows = (data || []) as EventListRow[];
      const events = rows.map((row) => mapAdminEvent(row, row.organizer));

      return {
        data: events,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllEvents:", error);
      throw error;
    }
  }

  async getEventById(id: string): Promise<AdminEventData | null> {
    try {
      const { data: event, error } = await this.db
        .from<EventRow>("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        logger.error("Error fetching event by id:", error);
        throw error;
      }
      if (!event) return null;

      const { data: organizer } = await this.db
        .from<OrganizerSummaryRow>("profiles")
        .select("name, avatar_url")
        .eq("id", event.organizer_profile_id)
        .single();

      return mapAdminEvent(event as EventRow, organizer as OrganizerSummaryRow | null);
    } catch (error) {
      logger.error("Error in getEventById:", error);
      throw error;
    }
  }

  async updateEvent(id: string, updates: Partial<AdminEventData>): Promise<AdminEventData | null> {
    try {
      const {
        organizer_name,
        organizer_avatar,
        participant_count,
        current_participants,
        created_at,
        updated_at,
        ...safeUpdates
      } = updates;

      const payload: Record<string, unknown> = { ...safeUpdates };
      const { data: updated, error } = await this.db
        .from<EventRow>("events")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        logger.error("Error updating event:", error);
        throw error;
      }

      return mapAdminEvent(updated as EventRow);
    } catch (error) {
      logger.error("Error in updateEvent:", error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.db.from<EventRow>("events").delete().eq("id", id);
      if (error) {
        logger.error("Error deleting event:", error);
        throw error;
      }
      return true;
    } catch (error) {
      logger.error("Error in deleteEvent:", error);
      throw error;
    }
  }

  async cancelEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from<EventRow>("events")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) {
        logger.error("Error cancelling event:", error);
        throw error;
      }
      return true;
    } catch (error) {
      logger.error("Error in cancelEvent:", error);
      throw error;
    }
  }

  async markAsCompleted(id: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from<EventRow>("events")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) {
        logger.error("Error marking event as completed:", error);
        throw error;
      }
      return true;
    } catch (error) {
      logger.error("Error in markAsCompleted:", error);
      throw error;
    }
  }

  async getEventParticipants(eventId: string): Promise<EventParticipantViewRow[]> {
    try {
      const { data, error } = await this.db
        .from<EventParticipantViewRow>("event_participants")
        .select(
          `
          profile_id,
          profiles(id, name, avatar_url)
        `,
        )
        .eq("event_id", eventId);

      if (error) {
        logger.error("Error fetching event participants:", error);
        throw error;
      }

      return (data || []) as EventParticipantViewRow[];
    } catch (error) {
      logger.error("Error in getEventParticipants:", error);
      throw error;
    }
  }

  async removeParticipant(eventId: string, profileId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from<EventParticipantRow>("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", profileId);

      if (error) {
        logger.error("Error removing event participant:", error);
        throw error;
      }

      await this.db.rpc("decrement_event_participants", { event_id: eventId });
      return true;
    } catch (error) {
      logger.error("Error in removeParticipant:", error);
      throw error;
    }
  }
}

export const adminEventsService = new AdminEventsServiceClass();
