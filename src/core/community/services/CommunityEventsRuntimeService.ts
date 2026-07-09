import { supabase } from "@/integrations/supabase";
import type { Json } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { CommunityRpcService } from "@/core/community/services/CommunityRpcService";
import type { TerritoryFilter } from "@/core/location/types";
import {
  eventsReadService,
  type EventFilters as GetEventsFilters,
  type EventPageInput as GetEventsPageInput,
  type EventPageOutput as GetEventsPageOutput,
  type EventSortBy,
  type EventSortOrder,
  type PublicEvent,
  type PublicEventStatus,
} from "@/core/verticals/events";

export type CommunityEvent = PublicEvent;

export type Event = CommunityEvent;
export type {
  EventSortBy,
  EventSortOrder,
  GetEventsFilters,
  GetEventsPageInput,
  GetEventsPageOutput,
};

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

  async getEventById(id: string): Promise<CommunityEvent | null> {
    return eventsReadService.getEventById(id);
  }

  async getEvents(filters?: GetEventsFilters): Promise<CommunityEvent[]> {
    return eventsReadService.getEvents(filters);
  }

  async getEventsPage(input: GetEventsPageInput = {}): Promise<GetEventsPageOutput> {
    return eventsReadService.getEventsPage(input);
  }

  async getByBounds(
    bounds: [number, number, number, number],
    options: { limit?: number; status?: string[]; territoryFilter?: TerritoryFilter } = {},
  ): Promise<CommunityEvent[]> {
    const statuses = options.status?.filter((status): status is PublicEventStatus =>
      status === "upcoming" || status === "ongoing" || status === "completed" || status === "cancelled",
    );
    return eventsReadService.getByBounds(bounds, {
      limit: options.limit,
      statuses: statuses && statuses.length > 0 ? statuses : undefined,
      territoryFilter: options.territoryFilter,
    });
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
      await CommunityRpcService.incrementEventParticipants(eventId, profileId);
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
      await CommunityRpcService.decrementEventParticipants(eventId, profileId);
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
    return eventsReadService.getEventsByOrganizerProfile(profileId, limit);
  }

  async getTotalEventsCount(): Promise<number> {
    return eventsReadService.getTotalEventsCount();
  }

  async getRecentEvents(limit = 10): Promise<CommunityEvent[]> {
    return eventsReadService.getRecentEvents(limit);
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    return eventsReadService.getEventsCreatedInPeriod(startDate, endDate);
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
