export type EducationEventTemporalState =
  | 'upcoming'
  | 'ongoing'
  | 'past'
  | 'invalid';

export interface EducationEventTemporalInput {
  startsAt: string;
  endsAt?: string | null;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getEducationEventTemporalState(
  event: EducationEventTemporalInput,
  nowMs = Date.now(),
): EducationEventTemporalState {
  const startsAt = toTimestamp(event.startsAt);
  if (startsAt === null) return 'invalid';

  const endsAt = toTimestamp(event.endsAt);
  if (event.endsAt && endsAt === null) return 'invalid';
  if (endsAt !== null && endsAt <= startsAt) return 'invalid';

  if (startsAt > nowMs) return 'upcoming';
  if (endsAt !== null && endsAt >= nowMs) return 'ongoing';
  return 'past';
}

export function isEducationEventActive(
  event: EducationEventTemporalInput,
  nowMs = Date.now(),
): boolean {
  const state = getEducationEventTemporalState(event, nowMs);
  return state === 'upcoming' || state === 'ongoing';
}
