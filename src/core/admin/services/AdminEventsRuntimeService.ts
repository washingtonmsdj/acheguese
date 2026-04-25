import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface AdminEventData {
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

class AdminEventsRuntimeService {
  async getTotalEventsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error("adminEventsRuntimeService.getTotalEventsCount", error);
      throw error;
    }

    return count || 0;
  }

  async getEventsCreatedInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      logger.error("adminEventsRuntimeService.getEventsCreatedInPeriod", error);
      throw error;
    }

    return count || 0;
  }

  async getRecentEvents(limit = 10): Promise<AdminEventData[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("adminEventsRuntimeService.getRecentEvents", error);
      throw error;
    }

    return (data || []) as AdminEventData[];
  }
}

export const adminEventsRuntimeService = new AdminEventsRuntimeService();
