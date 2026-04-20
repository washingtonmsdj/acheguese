import { supabase } from "@/integrations/supabase/supabase";

export interface NotificationPreferencesRecord {
  email_enabled: boolean;
  push_enabled: boolean;
  inapp_enabled: boolean;
  transactional_enabled: boolean;
  social_enabled: boolean;
  system_enabled: boolean;
  marketing_enabled: boolean;
  frequency: "immediate" | "daily" | "weekly" | "never";
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export class UserNotificationPreferencesService {
  static async getByUserId(userId: string): Promise<NotificationPreferencesRecord | null> {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data as NotificationPreferencesRecord;
  }

  static async updateByUserId(
    userId: string,
    preferences: NotificationPreferencesRecord,
  ): Promise<void> {
    const { error } = await supabase
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", userId);

    if (error) throw error;
  }
}

