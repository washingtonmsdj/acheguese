import { supabase } from "@/integrations/supabase/supabase";
import { applyTerritoryFilter } from "@/core/location/utils/applyTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types/TerritoryFilter";
import { logger } from "@/shared/utils/logger";

export interface CommunityEvent {
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
}

export type Event = CommunityEvent;

export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  image_url?: string;
  max_participants?: number;
  latitude?: number;
  longitude?: number;
  coordinate_source?: "exact" | "geocoded" | "approximate";
}

class CommunityEventsRuntimeService {
  async getEventById(id: string): Promise<CommunityEvent | null> {
    try {
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

  async getEvents(filters?: {
    category?: string;
    status?: string;
    upcoming?: boolean;
    territoryFilter?: TerritoryFilter;
  }): Promise<CommunityEvent[]> {
    try {
      let query = supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.upcoming) query = query.gte("date", new Date().toISOString());
      if (filters?.territoryFilter) {
        query = applyTerritoryFilter(query, filters.territoryFilter, "location_id");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CommunityEvent[];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEvents", error);
      return [];
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
        query = applyTerritoryFilter(query, territoryFilter, "location_id");
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
    } catch (error: any) {
      logger.error("CommunityEventsRuntimeService.createEvent", error);
      throw new Error(`Erro ao criar evento: ${error.message}`);
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
    } catch (error: any) {
      logger.error("CommunityEventsRuntimeService.updateEvent", error);
      throw new Error(`Erro ao atualizar evento: ${error.message}`);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    } catch (error: any) {
      logger.error("CommunityEventsRuntimeService.deleteEvent", error);
      throw new Error(`Erro ao deletar evento: ${error.message}`);
    }
  }

  async joinEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({ event_id: eventId, profile_id: profileId });

      if (error) throw error;
      await supabase.rpc("increment_event_participants", { event_id: eventId } as any);
    } catch (error: any) {
      logger.error("CommunityEventsRuntimeService.joinEvent", error);
      throw new Error(`Erro ao participar do evento: ${error.message}`);
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
      await supabase.rpc("decrement_event_participants", { event_id: eventId } as any);
    } catch (error: any) {
      logger.error("CommunityEventsRuntimeService.leaveEvent", error);
      throw new Error(`Erro ao sair do evento: ${error.message}`);
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

  async getEventParticipants(eventId: string) {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("profile_id, profiles(id, name, avatar_url)")
        .eq("event_id", eventId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("CommunityEventsRuntimeService.getEventParticipants", error);
      return [];
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
  static getEventsByOrganizerProfile = communityEventsRuntimeService.getEventsByOrganizerProfile.bind(communityEventsRuntimeService);
  static getTotalEventsCount = communityEventsRuntimeService.getTotalEventsCount.bind(communityEventsRuntimeService);
  static getRecentEvents = communityEventsRuntimeService.getRecentEvents.bind(communityEventsRuntimeService);
  static getEventsCreatedInPeriod = communityEventsRuntimeService.getEventsCreatedInPeriod.bind(communityEventsRuntimeService);
  static getByBounds = communityEventsRuntimeService.getByBounds.bind(communityEventsRuntimeService);
}

export const eventService = EventsService;
