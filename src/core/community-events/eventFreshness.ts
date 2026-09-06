import type {
  PublicEvent,
  PublicEventStatus,
} from "@/core/community-events/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const PUBLIC_ACTIVE_EVENT_STATUSES: readonly PublicEventStatus[] = [
  "upcoming",
  "ongoing",
];

export function isPublicActiveEventStatus(
  status: PublicEventStatus,
): status is "upcoming" | "ongoing" {
  return status === "upcoming" || status === "ongoing";
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isEventCurrentOrFuture(
  event: Pick<PublicEvent, "date" | "end_date" | "status">,
  now = Date.now(),
): boolean {
  const startsAt = toTimestamp(event.date);
  if (startsAt === null) return false;

  if (event.status === "upcoming") {
    return startsAt >= now;
  }

  if (event.status !== "ongoing" || startsAt > now) {
    return false;
  }

  const endsAt = toTimestamp(event.end_date);
  if (endsAt !== null) {
    return endsAt >= now;
  }

  // Ongoing sem data final não pode permanecer público indefinidamente.
  return startsAt >= now - DAY_MS;
}
