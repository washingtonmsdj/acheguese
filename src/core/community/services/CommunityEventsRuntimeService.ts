import { supabase } from "@/integrations/supabase/supabase";
import type { Json } from "@/integrations/supabase/types.generated";
import type { TerritoryFilter } from "@/core/location/types";
import { logger } from "@/shared/utils/logger";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date?: string | null;
  event_date?: string | null;
  location: string;
  location_id?: string;
  organizer_profile_id: string;
  category: string;
  image_url?: string;
  subtitle?: string | null;
  tags?: string[] | null;
  duration_minutes?: number | null;
  timezone?: string | null;
  location_type?: "physical" | "online" | "hybrid" | null;
  venue_name?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  online_url?: string | null;
  online_platform?: string | null;
  location_instructions?: string | null;
  is_free?: boolean | null;
  price?: number | null;
  waitlist_enabled?: boolean | null;
  requirements?: string[] | null;
  what_to_bring?: string[] | null;
  age_restriction?: string | null;
  dress_code?: string | null;
  accessibility_info?: string | null;
  banner_image_url?: string | null;
  video_url?: string | null;
  gallery?: Json[] | null;
  schedule?: Json[] | null;
  faq?: Json[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  features?: Record<string, Json> | null;
  organizer_contact?: Record<string, Json> | null;
  published_at?: string | null;
  max_participants?: number;
  current_participants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinate_source?: "exact" | "geocoded" | "approximate" | null;
}

export type Event = CommunityEvent;

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  end_date?: string;
  event_date?: string;
  location: string;
  category: string;
  image_url?: string;
  subtitle?: string;
  tags?: string[];
  duration_minutes?: number;
  timezone?: string;
  location_type?: "physical" | "online" | "hybrid";
  venue_name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  online_url?: string;
  online_platform?: string;
  location_instructions?: string;
  is_free?: boolean;
  price?: number;
  waitlist_enabled?: boolean;
  requirements?: string[];
  what_to_bring?: string[];
  age_restriction?: string;
  dress_code?: string;
  accessibility_info?: string;
  banner_image_url?: string;
  video_url?: string;
  gallery?: Json[];
  schedule?: Json[];
  faq?: Json[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  features?: Record<string, Json>;
  organizer_contact?: Record<string, Json>;
  max_participants?: number;
  latitude?: number;
  longitude?: number;
  coordinate_source?: "exact" | "geocoded" | "approximate";
}

export type EventSortBy = "date" | "created_at" | "current_participants";
export type EventSortOrder = "asc" | "desc";

export interface GetEventsFilters {
  category?: string;
  status?: string;
  upcoming?: boolean;
  territoryFilter?: TerritoryFilter;
}

export interface GetEventsPageInput extends GetEventsFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: EventSortBy;
  sortOrder?: EventSortOrder;
}

export interface GetEventsPageOutput {
  items: CommunityEvent[];
  totalCount: number;
  hasMore: boolean;
  nextPage: number | null;
}

export interface EventParticipantRow {
  profile_id: string;
  joined_at: string;
  checked_in_at: string | null;
  profiles:
    | {
        id: string;
        name: string | null;
        avatar_url: string | null;
      }
    | Array<{
        id: string;
        name: string | null;
        avatar_url: string | null;
      }>
    | null;
}

class CommunityEventsRuntimeService {
  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "erro desconhecido";
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  async getEventById(id: string): Promise<CommunityEvent | null> {
    try {

      if (!this.isUuid(id)) {
        return null;
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return (data as CommunityEvent | null) ?? null;
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventById", error);
      return null;
    }
  }

  async getEvents(filters?: GetEventsFilters): Promise<CommunityEvent[]> {
    try {
      let query = supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.upcoming) query = query.gte("date", new Date().toISOString());
      if (filters?.territoryFilter) {
        if (filters.territoryFilter.scope === "location") {
          query = query.eq("location_id", filters.territoryFilter.location_id);
        } else if (filters.territoryFilter.scope === "group") {
          query = query.in("location_id", filters.territoryFilter.location_ids);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommunityEvent[];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEvents", error);
      return [];
    }
  }

  async getEventsPage(input: GetEventsPageInput = {}): Promise<GetEventsPageOutput> {
    const page = Math.max(0, input.page ?? 0);
    const pageSize = Math.min(Math.max(input.pageSize ?? 12, 1), 50);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase
        .from("events")
        .select("*", { count: "exact" });

      if (input.category) query = query.eq("category", input.category);
      if (input.status) query = query.eq("status", input.status);
      if (input.upcoming) query = query.gte("date", new Date().toISOString());
      if (input.territoryFilter) {
        if (input.territoryFilter.scope === "location") {
          query = query.eq("location_id", input.territoryFilter.location_id);
        } else if (input.territoryFilter.scope === "group") {
          query = query.in("location_id", input.territoryFilter.location_ids);
        }
      }
      if (input.search?.trim()) {
        const search = sanitizeForILike(input.search);
        if (search) {
          query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
        }
      }

      const sortBy = input.sortBy ?? "date";
      const sortOrder = input.sortOrder ?? "asc";

      query = query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const items = (data || []) as CommunityEvent[];
      const totalCount = count || 0;
      const hasMore = from + items.length < totalCount;

      return {
        items,
        totalCount,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      };
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventsPage", error);
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
    options: { limit?: number; status?: string[]; territoryFilter?: TerritoryFilter } = {},
  ): Promise<CommunityEvent[]> {
    const [west, south, east, north] = bounds;
    const { limit = 200, status = ["upcoming", "ongoing"], territoryFilter } = options;

    try {
      let query = supabase
        .from("events")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east)
        .in("status", status)
        .order("date", { ascending: true })
        .limit(limit);

      if (territoryFilter) {
        if (territoryFilter.scope === "location") {
          query = query.eq("location_id", territoryFilter.location_id);
        } else if (territoryFilter.scope === "group") {
          query = query.in("location_id", territoryFilter.location_ids);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommunityEvent[];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getByBounds", error);
      return [];
    }
  }

  async createEvent(profileId: string, input: CreateEventInput): Promise<CommunityEvent> {
    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...input,
          organizer_profile_id: profileId,
          current_participants: 0,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;
      return data as CommunityEvent;
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.createEvent", error);
      throw new Error(`Erro ao criar evento: ${this.getErrorMessage(error)}`);
    }
  }

  async updateEvent(id: string, updates: Partial<CreateEventInput>): Promise<CommunityEvent> {
    try {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CommunityEvent;
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.updateEvent", error);
      throw new Error(`Erro ao atualizar evento: ${this.getErrorMessage(error)}`);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.deleteEvent", error);
      throw new Error(`Erro ao deletar evento: ${this.getErrorMessage(error)}`);
    }
  }

  async joinEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({ event_id: eventId, profile_id: profileId });

      if (error) throw error;
      await supabase.rpc("increment_event_participants", { event_id: eventId });
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.joinEvent", error);
      throw new Error(`Erro ao participar do evento: ${this.getErrorMessage(error)}`);
    }
  }

  async leaveEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", profileId);

      if (error) throw error;
      await supabase.rpc("decrement_event_participants", { event_id: eventId });
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.leaveEvent", error);
      throw new Error(`Erro ao sair do evento: ${this.getErrorMessage(error)}`);
    }
  }

  async isParticipating(eventId: string, profileId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.isParticipating", error);
      return false;
    }
  }

  async getEventParticipants(eventId: string): Promise<EventParticipantRow[]> {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("profile_id, joined_at, checked_in_at, profiles(id, name, avatar_url)")
        .eq("event_id", eventId);

      if (error) throw error;
      return ((data || []) as unknown as EventParticipantRow[]);
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventParticipants", error);
      return [];
    }
  }

  async getParticipantCheckinCode(eventId: string, profileId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("checkin_code")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;
      const code = (data as { checkin_code?: string } | null)?.checkin_code;
      if (!code) throw new Error("Participação no evento não encontrada.");
      return code;
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.getParticipantCheckinCode", error);
      throw new Error(`Erro ao gerar token de check-in: ${this.getErrorMessage(error)}`);
    }
  }

  async checkInEvent(eventId: string, profileId: string): Promise<string> {
    try {
      const { data: existing, error: existingError } = await supabase
        .from("event_participants")
        .select("checked_in_at")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (existingError) throw existingError;
      const existingCheckedInAt = (existing as { checked_in_at?: string } | null)?.checked_in_at;
      if (existingCheckedInAt) {
        return existingCheckedInAt;
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("event_participants")
        .update({ checked_in_at: now } as { checked_in_at: string })
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .select("checked_in_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Participação no evento não encontrada para este perfil.");
      }

      return (data as { checked_in_at?: string }).checked_in_at ?? now;
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.checkInEvent", error);
      throw new Error(`Erro ao fazer check-in: ${this.getErrorMessage(error)}`);
    }
  }

  async checkInEventByCode(eventId: string, checkinCode: string): Promise<{ profileId: string; checkedInAt: string }> {
    try {
      const { data: existing, error: existingError } = await supabase
        .from("event_participants")
        .select("profile_id, checked_in_at")
        .eq("event_id", eventId)
        .eq("checkin_code", checkinCode)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) {
        throw new Error("Código de check-in inválido para este evento.");
      }

      const existingRow = existing as { profile_id: string; checked_in_at?: string };
      if (existingRow.checked_in_at) {
        return {
          profileId: existingRow.profile_id,
          checkedInAt: existingRow.checked_in_at,
        };
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("event_participants")
        .update({ checked_in_at: now } as { checked_in_at: string })
        .eq("event_id", eventId)
        .eq("checkin_code", checkinCode)
        .select("profile_id, checked_in_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Código de check-in inválido para este evento.");
      }

      const row = data as { profile_id: string; checked_in_at?: string };
      return {
        profileId: row.profile_id,
        checkedInAt: row.checked_in_at ?? now,
      };
    } catch (error: unknown) {
      logger.error("CommunityEventsRuntimeService.checkInEventByCode", error);
      throw new Error(`Erro ao validar check-in por código: ${this.getErrorMessage(error)}`);
    }
  }

  async getCheckInStatus(eventId: string, profileId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("checked_in_at")
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;
      return (data as { checked_in_at?: string } | null)?.checked_in_at ?? null;
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getCheckInStatus", error);
      return null;
    }
  }

  async getEventsByOrganizerProfile(profileId: string, limit = 20): Promise<CommunityEvent[]> {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as CommunityEvent[];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventsByOrganizerProfile", error);
      return [];
    }
  }

  async getTotalEventsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getTotalEventsCount", error);
      return 0;
    }
  }

  async getRecentEvents(limit = 10): Promise<CommunityEvent[]> {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as CommunityEvent[];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getRecentEvents", error);
      return [];
    }
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventsCreatedInPeriod", error);
      return 0;
    }
  }
}

export const communityEventsRuntimeService = new CommunityEventsRuntimeService();

export class EventsService {
  static getEvents = communityEventsRuntimeService.getEvents.bind(communityEventsRuntimeService);
  static getEventById = communityEventsRuntimeService.getEventById.bind(communityEventsRuntimeService);
  static createEvent = communityEventsRuntimeService.createEvent.bind(communityEventsRuntimeService);
  static updateEvent = communityEventsRuntimeService.updateEvent.bind(communityEventsRuntimeService);
  static deleteEvent = communityEventsRuntimeService.deleteEvent.bind(communityEventsRuntimeService);
  static joinEvent = communityEventsRuntimeService.joinEvent.bind(communityEventsRuntimeService);
  static leaveEvent = communityEventsRuntimeService.leaveEvent.bind(communityEventsRuntimeService);
  static isParticipating = communityEventsRuntimeService.isParticipating.bind(communityEventsRuntimeService);
  static getEventParticipants = communityEventsRuntimeService.getEventParticipants.bind(communityEventsRuntimeService);
  static getParticipantCheckinCode = communityEventsRuntimeService.getParticipantCheckinCode.bind(communityEventsRuntimeService);
  static checkInEvent = communityEventsRuntimeService.checkInEvent.bind(communityEventsRuntimeService);
  static checkInEventByCode = communityEventsRuntimeService.checkInEventByCode.bind(communityEventsRuntimeService);
  static getCheckInStatus = communityEventsRuntimeService.getCheckInStatus.bind(communityEventsRuntimeService);
  static getEventsByOrganizerProfile = communityEventsRuntimeService.getEventsByOrganizerProfile.bind(communityEventsRuntimeService);
  static getTotalEventsCount = communityEventsRuntimeService.getTotalEventsCount.bind(communityEventsRuntimeService);
  static getRecentEvents = communityEventsRuntimeService.getRecentEvents.bind(communityEventsRuntimeService);
  static getEventsCreatedInPeriod = communityEventsRuntimeService.getEventsCreatedInPeriod.bind(communityEventsRuntimeService);
  static getByBounds = communityEventsRuntimeService.getByBounds.bind(communityEventsRuntimeService);
}

export const eventService = EventsService;
