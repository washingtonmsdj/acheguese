import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  mapEventRow,
  type EventRowWithLegacyCity,
} from "@/core/verticals/events/mappers";
import type {
  CreateEventInput,
  EventCheckInByCodeResult,
  EventParticipantRow,
  PublicEvent,
  UpdateEventInput,
} from "@/core/verticals/events/types";

type EventParticipantCounterAction = "incrementEventParticipants" | "decrementEventParticipants";

const EVENT_COUNTER_FUNCTION_NAME = "community-rpc";
const SERVICE_NAME = "EventMutationService";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "erro desconhecido";
}

async function invokeParticipantCounter(
  action: EventParticipantCounterAction,
  eventId: string,
  profileId: string,
): Promise<void> {
  await invokeSupabaseBroker<Record<string, boolean>, EventParticipantCounterAction>({
    action,
    functionName: EVENT_COUNTER_FUNCTION_NAME,
    noDataMessage: "Event participant counter broker returned no data",
    params: { eventId, profileId },
    serviceName: SERVICE_NAME,
  });
}

export class EventMutationService {
  async createEvent(profileId: string, input: CreateEventInput): Promise<PublicEvent> {
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
      return mapEventRow(data as EventRowWithLegacyCity);
    } catch (error: unknown) {
      logger.error("EventMutationService.createEvent", error);
      throw new Error(`Erro ao criar evento: ${getErrorMessage(error)}`);
    }
  }

  async updateEvent(id: string, updates: UpdateEventInput): Promise<PublicEvent> {
    try {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapEventRow(data as EventRowWithLegacyCity);
    } catch (error: unknown) {
      logger.error("EventMutationService.updateEvent", error);
      throw new Error(`Erro ao atualizar evento: ${getErrorMessage(error)}`);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    } catch (error: unknown) {
      logger.error("EventMutationService.deleteEvent", error);
      throw new Error(`Erro ao deletar evento: ${getErrorMessage(error)}`);
    }
  }

  async joinEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({ event_id: eventId, profile_id: profileId });

      if (error) throw error;
      await invokeParticipantCounter("incrementEventParticipants", eventId, profileId);
    } catch (error: unknown) {
      logger.error("EventMutationService.joinEvent", error);
      throw new Error(`Erro ao participar do evento: ${getErrorMessage(error)}`);
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
      await invokeParticipantCounter("decrementEventParticipants", eventId, profileId);
    } catch (error: unknown) {
      logger.error("EventMutationService.leaveEvent", error);
      throw new Error(`Erro ao sair do evento: ${getErrorMessage(error)}`);
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
      logger.error("EventMutationService.isParticipating", error);
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
      return (data ?? []) as unknown as EventParticipantRow[];
    } catch (error) {
      logger.error("EventMutationService.getEventParticipants", error);
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
      if (!code) throw new Error("Participacao no evento nao encontrada.");
      return code;
    } catch (error: unknown) {
      logger.error("EventMutationService.getParticipantCheckinCode", error);
      throw new Error(`Erro ao gerar token de check-in: ${getErrorMessage(error)}`);
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
      if (existingCheckedInAt) return existingCheckedInAt;

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("event_participants")
        .update({ checked_in_at: now } as { checked_in_at: string })
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .select("checked_in_at")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Participacao no evento nao encontrada para este perfil.");

      return (data as { checked_in_at?: string }).checked_in_at ?? now;
    } catch (error: unknown) {
      logger.error("EventMutationService.checkInEvent", error);
      throw new Error(`Erro ao fazer check-in: ${getErrorMessage(error)}`);
    }
  }

  async checkInEventByCode(
    eventId: string,
    checkinCode: string,
  ): Promise<EventCheckInByCodeResult> {
    try {
      const { data: existing, error: existingError } = await supabase
        .from("event_participants")
        .select("profile_id, checked_in_at")
        .eq("event_id", eventId)
        .eq("checkin_code", checkinCode)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) throw new Error("Codigo de check-in invalido para este evento.");

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
      if (!data) throw new Error("Codigo de check-in invalido para este evento.");

      const row = data as { profile_id: string; checked_in_at?: string };
      return {
        profileId: row.profile_id,
        checkedInAt: row.checked_in_at ?? now,
      };
    } catch (error: unknown) {
      logger.error("EventMutationService.checkInEventByCode", error);
      throw new Error(`Erro ao validar check-in por codigo: ${getErrorMessage(error)}`);
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
      logger.error("EventMutationService.getCheckInStatus", error);
      return null;
    }
  }
}

export const eventMutationService = new EventMutationService();
