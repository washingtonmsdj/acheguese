import { supabase } from "@/integrations/supabase";
import { ProfileSavedEntityService, type ProfileSavedEntityConfig } from "@/core/engagement/services/ProfileSavedEntityService";
import { logger } from "@/shared/utils/logger";

export const EVENT_REVIEW_LIMITS = {
  minRating: 1,
  maxRating: 5,
  minCommentLength: 10,
  maxCommentLength: 600,
} as const;

export const EVENT_REMINDER_TIMES = ["1hour", "1day", "1week"] as const;

export type EventReminderTime = (typeof EVENT_REMINDER_TIMES)[number];

export interface EventReview {
  id: string;
  eventId: string;
  reviewerProfileId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

export interface SubmitEventReviewInput {
  eventId: string;
  reviewerProfileId: string;
  rating: number;
  comment: string;
}

const EVENT_FAVORITE_CONFIG = {
  tableName: "event_favorites",
  entityIdColumn: "event_id",
  logLabel: "event_favorites",
} as const satisfies ProfileSavedEntityConfig;

type EventReviewRow = {
  id: string;
  event_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment: string;
  helpful_count: number | null;
  created_at: string;
  profiles?:
    | {
        display_name?: string | null;
        name?: string | null;
        avatar_url?: string | null;
        verified?: boolean | null;
      }
    | Array<{
        display_name?: string | null;
        name?: string | null;
        avatar_url?: string | null;
        verified?: boolean | null;
      }>
    | null;
};

const EVENT_REVIEW_SELECT = [
  "id",
  "event_id",
  "reviewer_profile_id",
  "rating",
  "comment",
  "helpful_count",
  "created_at",
  "profiles(display_name,name,avatar_url,verified)",
].join(",");

function normalizeReviewComment(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function validateEventReviewInput(input: Pick<SubmitEventReviewInput, "rating" | "comment">):
  | { valid: true; comment: string }
  | { valid: false; message: string } {
  if (!Number.isInteger(input.rating) || input.rating < EVENT_REVIEW_LIMITS.minRating || input.rating > EVENT_REVIEW_LIMITS.maxRating) {
    return { valid: false, message: "Selecione uma nota valida." };
  }

  const comment = normalizeReviewComment(input.comment);
  if (comment.length < EVENT_REVIEW_LIMITS.minCommentLength) {
    return { valid: false, message: `O comentario deve ter pelo menos ${EVENT_REVIEW_LIMITS.minCommentLength} caracteres.` };
  }
  if (comment.length > EVENT_REVIEW_LIMITS.maxCommentLength) {
    return { valid: false, message: `O comentario deve ter no maximo ${EVENT_REVIEW_LIMITS.maxCommentLength} caracteres.` };
  }

  return { valid: true, comment };
}

function normalizeReminderTimes(values: readonly EventReminderTime[]): EventReminderTime[] {
  const allowed = new Set<EventReminderTime>(EVENT_REMINDER_TIMES);
  return [...new Set(values.filter((value): value is EventReminderTime => allowed.has(value)))];
}

function mapReview(row: EventReviewRow): EventReview {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    eventId: row.event_id,
    reviewerProfileId: row.reviewer_profile_id,
    userName: profile?.display_name || profile?.name || "Participante",
    userAvatar: profile?.avatar_url ?? null,
    rating: row.rating,
    comment: row.comment,
    date: row.created_at,
    helpful: row.helpful_count ?? 0,
    verified: Boolean(profile?.verified),
  };
}

export class EventEngagementService {
  static async getReviews(eventId: string): Promise<EventReview[]> {
    try {
      const { data, error } = await supabase
        .from("event_reviews" as never)
        .select(EVENT_REVIEW_SELECT)
        .eq("event_id", eventId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown as EventReviewRow[]).map(mapReview);
    } catch (error) {
      logger.error("EventEngagementService.getReviews", error);
      return [];
    }
  }

  static async submitReview(input: SubmitEventReviewInput): Promise<EventReview> {
    const validation = validateEventReviewInput(input);
    if (validation.valid === false) throw new Error(validation.message);

    const { data, error } = await supabase
      .from("event_reviews" as never)
      .upsert({
        event_id: input.eventId,
        reviewer_profile_id: input.reviewerProfileId,
        rating: input.rating,
        comment: validation.comment,
        status: "active",
      } as never, { onConflict: "event_id,reviewer_profile_id" })
      .select(EVENT_REVIEW_SELECT)
      .single();

    if (error) {
      logger.error("EventEngagementService.submitReview", error);
      throw new Error("Nao foi possivel publicar a avaliacao.");
    }

    return mapReview(data as unknown as EventReviewRow);
  }

  static async markReviewHelpful(reviewId: string, profileId: string): Promise<void> {
    const { error } = await supabase
      .from("event_review_helpfulness" as never)
      .upsert({
        review_id: reviewId,
        profile_id: profileId,
      } as never, { onConflict: "review_id,profile_id", ignoreDuplicates: true });

    if (error) {
      logger.error("EventEngagementService.markReviewHelpful", error);
      throw new Error("Nao foi possivel registrar utilidade.");
    }
  }

  static async getReminderTimes(eventId: string, profileId: string): Promise<EventReminderTime[]> {
    try {
      const { data, error } = await supabase
        .from("event_reminders" as never)
        .select("reminder_time")
        .eq("event_id", eventId)
        .eq("profile_id", profileId);

      if (error) throw error;
      const values = ((data ?? []) as unknown as Array<{ reminder_time?: string }>).map((row) => row.reminder_time);
      return normalizeReminderTimes(values as EventReminderTime[]);
    } catch (error) {
      logger.error("EventEngagementService.getReminderTimes", error);
      return [];
    }
  }

  static async saveReminderTimes(
    eventId: string,
    profileId: string,
    nextTimes: readonly EventReminderTime[],
  ): Promise<EventReminderTime[]> {
    const normalized = normalizeReminderTimes(nextTimes);
    const current = await EventEngagementService.getReminderTimes(eventId, profileId);
    const currentSet = new Set(current);
    const nextSet = new Set(normalized);
    const removed = current.filter((value) => !nextSet.has(value));
    const added = normalized.filter((value) => !currentSet.has(value));

    if (removed.length > 0) {
      const { error } = await supabase
        .from("event_reminders" as never)
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", profileId)
        .in("reminder_time", removed);

      if (error) {
        logger.error("EventEngagementService.removeReminderTimes", error);
        throw new Error("Nao foi possivel remover lembretes.");
      }
    }

    if (added.length > 0) {
      const { error } = await supabase
        .from("event_reminders" as never)
        .insert(added.map((reminderTime) => ({
          event_id: eventId,
          profile_id: profileId,
          reminder_time: reminderTime,
        })) as never);

      if (error) {
        logger.error("EventEngagementService.addReminderTimes", error);
        throw new Error("Nao foi possivel salvar lembretes.");
      }
    }

    return normalized;
  }

  static async getFavoriteEventIds(profileId: string): Promise<string[]> {
    return ProfileSavedEntityService.getSavedEntityIds(EVENT_FAVORITE_CONFIG, profileId);
  }

  static async addFavorite(eventId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.save(EVENT_FAVORITE_CONFIG, eventId, profileId);
  }

  static async removeFavorite(eventId: string, profileId: string): Promise<void> {
    return ProfileSavedEntityService.remove(EVENT_FAVORITE_CONFIG, eventId, profileId);
  }

  static async clearFavorites(profileId: string): Promise<void> {
    return ProfileSavedEntityService.clearProfileSavedEntities(EVENT_FAVORITE_CONFIG, profileId);
  }
}
