import { supabase, type Database } from "@/integrations/supabase";

type NotificationPreferencesRow =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

export const NOTIFICATION_FREQUENCIES = [
  "immediate",
  "daily",
  "weekly",
  "never",
] as const;

export type NotificationFrequency =
  (typeof NOTIFICATION_FREQUENCIES)[number];

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  inapp_enabled: boolean;
  transactional_enabled: true;
  social_enabled: boolean;
  system_enabled: boolean;
  marketing_enabled: boolean;
  frequency: NotificationFrequency;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_days: number[] | null;
}

export type NotificationChannelPatch = Pick<
  NotificationPreferences,
  "email_enabled" | "push_enabled" | "inapp_enabled"
>;

export type NotificationTopicPatch = Pick<
  NotificationPreferences,
  "social_enabled" | "system_enabled" | "marketing_enabled"
>;

export interface NotificationQuietHoursPatch {
  start: string | null;
  end: string | null;
  days?: number[] | null;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  push_enabled: true,
  inapp_enabled: true,
  transactional_enabled: true,
  social_enabled: true,
  system_enabled: true,
  marketing_enabled: false,
  frequency: "immediate",
  quiet_hours_start: null,
  quiet_hours_end: null,
  quiet_hours_days: [1, 2, 3, 4, 5, 6, 7],
};

function isNotificationFrequency(value: string): value is NotificationFrequency {
  return NOTIFICATION_FREQUENCIES.some((frequency) => frequency === value);
}

function toPreferences(row: NotificationPreferencesRow): NotificationPreferences {
  if (!isNotificationFrequency(row.frequency)) {
    throw new Error("Invalid notification preference frequency from database");
  }
  if (!row.transactional_enabled) {
    throw new Error("Transactional notification preference invariant violated");
  }

  return {
    email_enabled: row.email_enabled,
    push_enabled: row.push_enabled,
    inapp_enabled: row.inapp_enabled,
    transactional_enabled: true,
    social_enabled: row.social_enabled,
    system_enabled: row.system_enabled,
    marketing_enabled: row.marketing_enabled,
    frequency: row.frequency,
    quiet_hours_start: row.quiet_hours_start,
    quiet_hours_end: row.quiet_hours_end,
    quiet_hours_days: row.quiet_hours_days,
  };
}

class NotificationPreferencesServiceClass {
  async get(): Promise<NotificationPreferences> {
    const { data, error } = await supabase.rpc(
      "get_current_notification_preferences",
    );
    if (error) throw error;
    return toPreferences(data);
  }

  async patchChannels(
    patch: Partial<NotificationChannelPatch>,
  ): Promise<NotificationPreferences> {
    return this.patch({
      p_email_enabled: patch.email_enabled,
      p_push_enabled: patch.push_enabled,
      p_inapp_enabled: patch.inapp_enabled,
    });
  }

  async patchTopics(
    patch: Partial<NotificationTopicPatch>,
  ): Promise<NotificationPreferences> {
    return this.patch({
      p_social_enabled: patch.social_enabled,
      p_system_enabled: patch.system_enabled,
      p_marketing_enabled: patch.marketing_enabled,
    });
  }

  async patchFrequency(
    frequency: NotificationFrequency,
  ): Promise<NotificationPreferences> {
    return this.patch({ p_frequency: frequency });
  }

  async patchQuietHours(
    patch: NotificationQuietHoursPatch,
  ): Promise<NotificationPreferences> {
    if ((patch.start === null) !== (patch.end === null)) {
      throw new Error("Quiet hours require both start and end");
    }

    return this.patch({
      p_quiet_hours_set: true,
      p_quiet_hours_start: patch.start ?? undefined,
      p_quiet_hours_end: patch.end ?? undefined,
      p_quiet_hours_days: patch.days ?? undefined,
    });
  }

  async patchAll(
    preferences: NotificationPreferences,
  ): Promise<NotificationPreferences> {
    return this.patch({
      p_email_enabled: preferences.email_enabled,
      p_push_enabled: preferences.push_enabled,
      p_inapp_enabled: preferences.inapp_enabled,
      p_social_enabled: preferences.social_enabled,
      p_system_enabled: preferences.system_enabled,
      p_marketing_enabled: preferences.marketing_enabled,
      p_frequency: preferences.frequency,
      p_quiet_hours_set: true,
      p_quiet_hours_start: preferences.quiet_hours_start ?? undefined,
      p_quiet_hours_end: preferences.quiet_hours_end ?? undefined,
      p_quiet_hours_days: preferences.quiet_hours_days ?? undefined,
    });
  }

  private async patch(
    args: Database["public"]["Functions"]["patch_current_notification_preferences"]["Args"],
  ): Promise<NotificationPreferences> {
    const { data, error } = await supabase.rpc(
      "patch_current_notification_preferences",
      args,
    );
    if (error) throw error;
    return toPreferences(data);
  }
}

export const NotificationPreferencesService =
  new NotificationPreferencesServiceClass();
