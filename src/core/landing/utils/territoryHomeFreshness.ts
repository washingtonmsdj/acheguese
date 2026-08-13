import type { Post } from "@/core/posts/types";
import { hasTechnicalSeedMarker } from "@/core/posts/utils/publicPostContent";
import type { PublicEvent } from "@/core/verticals/events";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isRecentActivity(
  value: string | null | undefined,
  now: number,
  maxAgeDays = 30,
): boolean {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return false;
  return timestamp <= now && timestamp >= now - maxAgeDays * DAY_MS;
}

export function selectRecentPosts(
  posts: readonly Post[],
  now: number,
  limit = 4,
): Post[] {
  return posts
    .filter(
      (post) =>
        isRecentActivity(post.created_at, now) &&
        !hasTechnicalSeedMarker(post.content),
    )
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, limit);
}

export function hasTechnicalSeedLabel(value: string | null | undefined): boolean {
  if (!value) return false;
  return /(?:^|[\s[\]_-])(?:ai[\s_-]*seed|seed|e2e|mock(?:[\s_-]*data)?|tests?|testes?|demo)(?:$|[\s[\]_-])/i.test(
    value,
  );
}

export function isCurrentOrFutureEvent(event: PublicEvent, now: number): boolean {
  const startsAt = toTimestamp(event.date);
  if (startsAt === null || event.status === "cancelled" || event.status === "completed") {
    return false;
  }

  if (startsAt >= now) return true;

  const endsAt = toTimestamp(event.end_date);
  if (endsAt !== null) return endsAt >= now;

  // Um status "ongoing" sem data final não é aceito indefinidamente.
  return event.status === "ongoing" && startsAt >= now - DAY_MS;
}

export function selectValidEvents(
  events: readonly PublicEvent[],
  now: number,
  limit = 8,
): PublicEvent[] {
  const unique = new Map<string, PublicEvent>();
  for (const event of events) {
    if (
      isCurrentOrFutureEvent(event, now) &&
      !hasTechnicalSeedLabel(event.title) &&
      !hasTechnicalSeedLabel(event.description)
    ) {
      unique.set(event.id, event);
    }
  }

  return [...unique.values()]
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date))
    .slice(0, limit);
}

export function selectEventsHappeningSoon(
  events: readonly PublicEvent[],
  now: number,
  horizonHours = 36,
): PublicEvent[] {
  const horizon = now + horizonHours * HOUR_MS;
  return selectValidEvents(events, now).filter((event) => {
    const startsAt = toTimestamp(event.date);
    return startsAt !== null && startsAt <= horizon;
  });
}
