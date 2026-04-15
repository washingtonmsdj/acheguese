import type { FamilyLocationData } from "@/core/family/types";

export type FamilyLocationPresenceStatus = "online" | "away" | "offline";

export interface FamilyLocationPresence {
  status: FamilyLocationPresenceStatus;
  minutesSinceUpdate: number | null;
}

const ONLINE_THRESHOLD_MINUTES = 5;
const AWAY_THRESHOLD_MINUTES = 30;

export function resolveFamilyLocationPresence(
  location: FamilyLocationData | null | undefined,
  now: Date = new Date(),
): FamilyLocationPresence {
  if (!location) {
    return { status: "offline", minutesSinceUpdate: null };
  }

  const updatedAt = location.updated_at ?? location.timestamp;
  const updatedAtDate = new Date(updatedAt);

  if (Number.isNaN(updatedAtDate.getTime())) {
    return { status: "offline", minutesSinceUpdate: null };
  }

  const minutesSinceUpdate = Math.max(
    0,
    Math.floor((now.getTime() - updatedAtDate.getTime()) / 60000),
  );

  if (minutesSinceUpdate < ONLINE_THRESHOLD_MINUTES) {
    return { status: "online", minutesSinceUpdate };
  }

  if (minutesSinceUpdate < AWAY_THRESHOLD_MINUTES) {
    return { status: "away", minutesSinceUpdate };
  }

  return { status: "offline", minutesSinceUpdate };
}
