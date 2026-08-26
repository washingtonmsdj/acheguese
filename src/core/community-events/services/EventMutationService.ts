import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  mapEventRow,
  type EventRowWithLegacyCity,
} from "@/core/community-events/mappers";
import type {
  CreateEventInput,
  EventCheckInByCodeResult,
  EventParticipantRow,
  PublicEvent,
  UpdateEventInput,
} from "@/core/community-events/types";

type EventRpcAction = "joinEvent" | "leaveEvent" | "checkInEvent" | "checkInEventByCode";

interface EventJoinResult {
  joined: boolean;
  alreadyParticipating: boolean;
  participantId: string;
  checkinCode: string;
  joinedAt: string;
  currentParticipants: number;
}

interface EventLeaveResult {
  left: boolean;
  participantId: string | null;
  currentParticipants: number;
}

interface EventCheckInResult {
  participantId: string;
  profileId: string;
  checkedInAt: string;
}

const EVENT_RPC_FUNCTION_NAME = "event-rpc";
const SERVICE_NAME = "EventMutationService";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "erro desconhecido";
}

async function invokeEventRpc<TResult>(
  action: EventRpcAction,
  params: Record<string, unknown>,
): Promise<TResult> {
  return invokeSupabaseBroker<TResult, EventRpcAction>({
    action,
    functionName: EVENT_RPC_FUNCTION_NAME,
    noDataMessage: "Event broker returned no data",
    params,
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
      await invokeEventRpc<EventJoinResult>("joinEvent", { eventId, profileId });
    } catch (error: unknown) {
      logger.error("EventMutationService.joinEvent", error);
      throw new Error(`Erro ao participar do evento: ${getErrorMessage(error)}`);
    }
  }

  async leaveEvent(eventId: string, profileId: string): Promise<void> {
    try {
      await invokeEventRpc<EventLeaveResult>("leaveEvent", { eventId, profileId });
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
      const result = await invokeEventRpc<EventCheckInResult>("checkInEvent", { eventId, profileId });
      return result.checkedInAt;
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
      const row = await invokeEventRpc<EventCheckInResult>("checkInEventByCode", {
        eventId,
        checkinCode,
      });
      return {
        profileId: row.profileId,
        checkedInAt: row.checkedInAt,
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
