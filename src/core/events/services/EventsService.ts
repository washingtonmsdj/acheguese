// @ts-nocheck
/**
 * EventsService - SSOT para eventos da comunidade
 * 
 * Encapsula acesso ao Supabase para operações de eventos.
 * Modules devem usar este service ao invés de acessar integrations diretamente.
 * 
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/shared/utils/logger";
import type { TerritoryFilter } from "@/core/location/types/TerritoryFilter";
import { applyTerritoryFilter } from "@/core/location/utils/applyTerritoryFilter";

export interface Event {
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
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Coordenadas geográficas (adicionadas na migration 20260403000001)
  latitude?: number | null;
  longitude?: number | null;
  coordinate_source?: 'exact' | 'geocoded' | 'approximate' | null;
}

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
  coordinate_source?: 'exact' | 'geocoded' | 'approximate';
}

export class EventsService {
  /**
   * Buscar todos os eventos
   * ✅ Suporta filtro territorial via TerritoryFilter
   */
  static async getEvents(filters?: {
    category?: string;
    status?: string;
    upcoming?: boolean;
    territoryFilter?: TerritoryFilter; // ✅ Filtro territorial
  }): Promise<Event[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.upcoming) {
        query = query.gte('date', new Date().toISOString());
      }

      // ✅ SSOT: Aplicar filtro territorial
      if (filters?.territoryFilter) {
        query = applyTerritoryFilter(query, filters.territoryFilter, 'location_id');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Buscar evento por ID
   */
  static async getEventById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error fetching event:', error);
      return null;
    }
  }

  /**
   * Criar novo evento
   */
  static async createEvent(
    profileId: string,
    input: CreateEventInput
  ): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...input,
          organizer_profile_id: profileId,
          current_participants: 0,
          status: 'upcoming'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error creating event:', error);
      throw new Error(`Erro ao criar evento: ${error.message}`);
    }
  }

  /**
   * Atualizar evento
   */
  static async updateEvent(
    id: string,
    updates: Partial<CreateEventInput>
  ): Promise<Event> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error updating event:', error);
      throw new Error(`Erro ao atualizar evento: ${error.message}`);
    }
  }

  /**
   * Deletar evento
   */
  static async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      logger.error('Error deleting event:', error);
      throw new Error(`Erro ao deletar evento: ${error.message}`);
    }
  }

  /**
   * Participar de evento
   */
  static async joinEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          profile_id: profileId
        });

      if (error) throw error;

      // Incrementar contador
      await supabase.rpc('increment_event_participants', { event_id: eventId });
    } catch (error: any) {
      logger.error('Error joining event:', error);
      throw new Error(`Erro ao participar do evento: ${error.message}`);
    }
  }

  /**
   * Sair de evento
   */
  static async leaveEvent(eventId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('profile_id', profileId);

      if (error) throw error;

      // Decrementar contador
      await supabase.rpc('decrement_event_participants', { event_id: eventId });
    } catch (error: any) {
      logger.error('Error leaving event:', error);
      throw new Error(`Erro ao sair do evento: ${error.message}`);
    }
  }

  /**
   * Verificar se usuário está participando
   */
  static async isParticipating(
    eventId: string,
    profileId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('profile_id', profileId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error: any) {
      logger.error('Error checking participation:', error);
      return false;
    }
  }

  /**
   * Buscar participantes de um evento
   */
  static async getEventParticipants(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          profile_id,
          profiles(id, name, avatar_url)
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching event participants:', error);
      return [];
    }
  }

  /**
   * Buscar eventos criados por um perfil especifico.
   * Usado pelo workspace privado do perfil.
   */
  static async getEventsByOrganizerProfile(
    profileId: string,
    limit = 20,
  ): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching events by organizer:', error);
      return [];
    }
  }

  // ============================================================================
  // 📊 ESTATÍSTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * 📊 OBTER CONTAGEM TOTAL DE EVENTOS
   * ✅ SSOT para contagem de eventos no dashboard admin
   *
   * @returns Número total de eventos cadastrados
   */
  static async getTotalEventsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error getting events count', error, {
          service: 'EventsService',
          method: 'getTotalEventsCount',
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting events count', error as Error, {
        service: 'EventsService',
        method: 'getTotalEventsCount',
      });
      return 0;
    }
  }

  /**
   * 📋 OBTER EVENTOS RECENTES
   * ✅ SSOT para atividade recente de eventos
   *
   * @param limit - Número máximo de resultados (padrão: 10)
   * @returns Lista de eventos recentes
   */
  static async getRecentEvents(limit = 10): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting recent events', error, {
          service: 'EventsService',
          method: 'getRecentEvents',
          limit,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting recent events', error as Error, {
        service: 'EventsService',
        method: 'getRecentEvents',
      });
      return [];
    }
  }

  /**
   * 📅 OBTER EVENTOS CRIADOS EM UM PERÍODO
   * ✅ SSOT para atividade de eventos por período
   *
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Número de eventos criados no período
   */
  static async getEventsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        logger.error('Error getting events in period', error, {
          service: 'EventsService',
          method: 'getEventsCreatedInPeriod',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting events in period', error as Error, {
        service: 'EventsService',
        method: 'getEventsCreatedInPeriod',
      });
      return 0;
    }
  }

  /**
   * Buscar eventos dentro de um bounding box geográfico.
   * Requer que os eventos tenham latitude/longitude preenchidos (migration 20260403000001).
   *
   * @param bounds [west, south, east, north]
   * @param options.limit Parâmetro operacional — revisar após medir volume real por bounds típico
   * @param options.status Filtro de status (padrão: upcoming e ongoing)
   */
  static async getByBounds(
    bounds: [number, number, number, number],
    options: { limit?: number; status?: string[]; territoryFilter?: TerritoryFilter } = {}
  ): Promise<Event[]> {
    const [west, south, east, north] = bounds;
    const { limit = 200, status = ['upcoming', 'ongoing'], territoryFilter } = options;

    try {
      let query = supabase
        .from('events')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('latitude', south)
        .lte('latitude', north)
        .gte('longitude', west)
        .lte('longitude', east)
        .in('status', status)
        .order('date', { ascending: true })
        .limit(limit);

      // Aplicar filtro territorial quando disponível
      if (territoryFilter) {
        query = applyTerritoryFilter(query, territoryFilter, 'location_id');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching events by bounds:', error);
      return [];
    }
  }
}

// Singleton instance para consistência com outros serviços
export const eventService = EventsService;
