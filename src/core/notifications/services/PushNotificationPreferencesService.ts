import { supabase } from "@/integrations/supabase";

export interface PushNotificationPreferencesRecord {
  notify_pet_perdido: boolean;
  notify_alerta: boolean;
  notify_evento: boolean;
  notify_recomendacao: boolean;
  notify_discussao: boolean;
  radius_meters: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export class PushNotificationPreferencesService {
  static async getByUserId(userId: string): Promise<PushNotificationPreferencesRecord | null> {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as PushNotificationPreferencesRecord) || null;
  }

  static async upsertByUserId(
    userId: string,
    preferences: PushNotificationPreferencesRecord,
  ): Promise<void> {
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...preferences }, { onConflict: "user_id" });

    if (error) throw error;
  }
}


