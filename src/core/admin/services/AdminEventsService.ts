/**
 * AdminEventsService - Serviço de administração de eventos
 *
 * ✅ SSOT COMPLIANCE: Delega para EventsService (core/events)
 * Este serviço encapsula operações administrativas de eventos,
 * delegando para o EventsService (SSOT) sempre que possível.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

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

interface EventStatusRow {
  status: string | null;
}

interface EventListRow extends AdminEventData {
  organizer?: { name?: string | null; avatar_url?: string | null } | null;
}

class AdminEventsServiceClass {
  private readonly db = supabase as any;
  /**
   * Busca estatísticas de eventos
   */
  async getStats(): Promise<EventsStats> {
    try {
      const { data, error } = await this.db
        .from("events")
        .select("status");

      if (error) {
        logger.error("Error fetching events stats:", error);
        throw error;
      }

      const rows: EventStatusRow[] = data || [];
      const stats: EventsStats = {
        total: rows.length,
        upcoming: rows.filter((e) => e.status === "upcoming").length,
        ongoing: rows.filter((e) => e.status === "ongoing").length,
        completed: rows.filter((e) => e.status === "completed").length,
        cancelled: rows.filter((e) => e.status === "cancelled").length,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  /**
   * Busca todos os eventos com paginação
   * ✅ SSOT: Delega para EventsService.getEvents quando possível
   */
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

      let query = this.db
        .from("events")
        .select(
          `
          *,
          organizer:profiles!organizer_profile_id (
            id,
            name,
            avatar_url
          ),
          locations(name, slug)
          `,
          { count: "exact" }
        );

      // Aplica filtro de status se fornecido
      if (options.status) {
        query = query.eq("status", options.status);
      }

      // Aplica busca se fornecida
      if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
      }

      query = query
        .order("date", { ascending: true })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error fetching events:", error);
        throw error;
      }

      const rows = (data || []) as EventListRow[];
      const events: AdminEventData[] = rows.map((item) => ({
        ...item,
        organizer_name: item.organizer?.name,
        organizer_avatar: item.organizer?.avatar_url,
      }));

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

  /**
   * Busca um evento por ID
   * ✅ SSOT: Delega para EventsService.getEventById
   */
  async getEventById(id: string): Promise<AdminEventData | null> {
    try {
      const { data: event, error } = await this.db
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        logger.error("Error fetching event by id:", error);
        throw error;
      }
      
      if (!event) {
        return null;
      }

      // Busca informações do organizador
      const { data: organizer } = await this.db
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", event.organizer_profile_id)
        .single();

      return {
        ...event,
        organizer_name: organizer?.name,
        organizer_avatar: organizer?.avatar_url,
      } as AdminEventData;
    } catch (error) {
      logger.error("Error in getEventById:", error);
      throw error;
    }
  }

  /**
   * Atualiza um evento
   * ✅ SSOT: Delega para EventsService.updateEvent
   */
  async updateEvent(
    id: string,
    updates: Partial<AdminEventData>,
  ): Promise<AdminEventData | null> {
    try {
      // Remove campos que não são parte de CreateEventInput
      const { organizer_name, organizer_avatar, organizer_profile_id, current_participants, created_at, updated_at, ...safeUpdates } = updates;

      const { data: updated, error } = await this.db
        .from("events")
        .update(safeUpdates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        logger.error("Error updating event:", error);
        throw error;
      }
      
      return updated as AdminEventData;
    } catch (error) {
      logger.error("Error in updateEvent:", error);
      throw error;
    }
  }

  /**
   * Deleta um evento
   * ✅ SSOT: Delega para EventsService.deleteEvent
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("events")
        .delete()
        .eq("id", id);

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

  /**
   * Cancela um evento (muda status para cancelled)
   */
  async cancelEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("events")
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

  /**
   * Marca evento como completed
   */
  async markAsCompleted(id: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("events")
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

  /**
   * Busca participantes de um evento
   * ✅ SSOT: Delega para EventsService.getEventParticipants
   */
  async getEventParticipants(eventId: string) {
    try {
      const { data, error } = await this.db
        .from("event_participants")
        .select(`
          profile_id,
          profiles(id, name, avatar_url)
        `)
        .eq("event_id", eventId);

      if (error) {
        logger.error("Error fetching event participants:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("Error in getEventParticipants:", error);
      throw error;
    }
  }

  /**
   * Remove participante de um evento (admin action)
   * ✅ SSOT: Delega para EventsService.leaveEvent
   */
  async removeParticipant(eventId: string, profileId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("event_participants")
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

