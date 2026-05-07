import {
  TRUST_EVENT_STATUSES,
  TRUST_EVENT_TYPES,
  type TrustActorRole,
  type TrustEvent,
  type TrustPolicyDecision,
  type TrustScoreSummary,
} from "../domain";

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIONABLE_STATUSES = new Set<TrustEvent["status"]>([
  TRUST_EVENT_STATUSES.ACTIVE,
  TRUST_EVENT_STATUSES.UNDER_REVIEW,
  TRUST_EVENT_STATUSES.CONFIRMED,
  TRUST_EVENT_STATUSES.PENALIZED,
]);

function isActionableEvent(event: TrustEvent): boolean {
  if (!ACTIONABLE_STATUSES.has(event.status)) return false;
  if (event.event_type === TRUST_EVENT_TYPES.REVIEW) return (event.rating ?? 5) <= 2;

  return (
    event.event_type === TRUST_EVENT_TYPES.INCIDENT ||
    event.event_type === TRUST_EVENT_TYPES.LATE_CANCELLATION ||
    event.event_type === TRUST_EVENT_TYPES.NO_SHOW ||
    event.severity === "high" ||
    event.severity === "critical" ||
    (event.rating ?? 5) <= 2
  );
}

function severityWeight(severity: TrustEvent["severity"]): number {
  if (severity === "critical") return 25;
  if (severity === "high") return 16;
  if (severity === "medium") return 8;
  return 3;
}

function eventWeight(event: TrustEvent): number {
  if (!ACTIONABLE_STATUSES.has(event.status)) return 0;

  let weight = severityWeight(event.severity);
  if (event.event_type === TRUST_EVENT_TYPES.LATE_CANCELLATION) weight += 8;
  if (event.event_type === TRUST_EVENT_TYPES.INCIDENT) weight += 10;
  if (event.event_type === TRUST_EVENT_TYPES.NO_SHOW) weight += 10;
  if ((event.rating ?? 5) <= 2) weight += 8;
  if (event.status === TRUST_EVENT_STATUSES.CONFIRMED) weight += 5;
  if (event.status === TRUST_EVENT_STATUSES.PENALIZED) weight += 15;

  return weight;
}

function countSince(events: TrustEvent[], now: Date, days: number): number {
  const threshold = now.getTime() - days * DAY_MS;
  return events.filter(
    (event) =>
      isActionableEvent(event) && new Date(event.created_at).getTime() >= threshold,
  ).length;
}

function averageRating(events: TrustEvent[]): number | null {
  const ratings = events
    .map((event) => event.rating)
    .filter((rating): rating is number => rating !== null);

  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

export class TrustPolicyService {
  static buildScoreSummary(
    profileId: string,
    role: TrustActorRole,
    events: TrustEvent[],
  ): TrustScoreSummary {
    const subjectEvents = events.filter(
      (event) => event.subject_profile_id === profileId && event.subject_role === role,
    );
    const actionableEvents = subjectEvents.filter((event) =>
      ACTIONABLE_STATUSES.has(event.status),
    );
    const ratingAverage = averageRating(actionableEvents);
    const incidentCount = actionableEvents.filter(
      (event) => event.event_type === TRUST_EVENT_TYPES.INCIDENT,
    ).length;
    const lateCancellationCount = actionableEvents.filter(
      (event) => event.event_type === TRUST_EVENT_TYPES.LATE_CANCELLATION,
    ).length;
    const highSeverityCount = actionableEvents.filter(
      (event) => event.severity === "high" || event.severity === "critical",
    ).length;
    const penalty = actionableEvents.reduce(
      (total, event) => total + eventWeight(event),
      0,
    );
    const ratingBonus = ratingAverage === null ? 0 : Math.round((ratingAverage - 3) * 8);
    const reliabilityScore = Math.max(0, Math.min(100, 100 - penalty + ratingBonus));

    return {
      profile_id: profileId,
      role,
      average_rating: ratingAverage,
      total_events: subjectEvents.length,
      incident_count: incidentCount,
      late_cancellation_count: lateCancellationCount,
      high_severity_count: highSeverityCount,
      reliability_score: reliabilityScore,
    };
  }

  static evaluateProfile(
    profileId: string,
    role: TrustActorRole,
    events: TrustEvent[],
    now = new Date(),
  ): TrustPolicyDecision {
    const subjectEvents = events.filter(
      (event) => event.subject_profile_id === profileId && event.subject_role === role,
    );
    const summary = this.buildScoreSummary(profileId, role, subjectEvents);
    const recurrence30d = countSince(subjectEvents, now, 30);
    const recurrence90d = countSince(subjectEvents, now, 90);
    const hasCritical = subjectEvents.some(
      (event) =>
        ACTIONABLE_STATUSES.has(event.status) && event.severity === "critical",
    );
    const hasPenalized = subjectEvents.some(
      (event) => event.status === TRUST_EVENT_STATUSES.PENALIZED,
    );
    const reasons: string[] = [];

    if (summary.reliability_score < 50) reasons.push("score abaixo de 50");
    if (recurrence30d >= 3) reasons.push("3 ou mais ocorrencias em 30 dias");
    if (recurrence90d >= 5) reasons.push("5 ou mais ocorrencias em 90 dias");
    if (hasCritical) reasons.push("ocorrencia critica");
    if (hasPenalized) reasons.push("evento ja penalizado");

    if (hasCritical || hasPenalized || summary.reliability_score < 35) {
      return {
        profile_id: profileId,
        role,
        summary,
        risk_level: "critical",
        dispatch_policy: "block_until_admin_review",
        recommended_action: "temporary_restriction",
        recurrence_30d: recurrence30d,
        recurrence_90d: recurrence90d,
        reasons,
      };
    }

    if (recurrence30d >= 3 || recurrence90d >= 5 || summary.reliability_score < 60) {
      return {
        profile_id: profileId,
        role,
        summary,
        risk_level: "restricted",
        dispatch_policy: "review_before_assignment",
        recommended_action: "manual_review",
        recurrence_30d: recurrence30d,
        recurrence_90d: recurrence90d,
        reasons,
      };
    }

    if (recurrence30d >= 1 || summary.reliability_score < 80) {
      return {
        profile_id: profileId,
        role,
        summary,
        risk_level: "watchlist",
        dispatch_policy: "limited_priority",
        recommended_action: "warn",
        recurrence_30d: recurrence30d,
        recurrence_90d: recurrence90d,
        reasons: reasons.length > 0 ? reasons : ["monitoramento preventivo"],
      };
    }

    return {
      profile_id: profileId,
      role,
      summary,
      risk_level: "trusted",
      dispatch_policy: "normal",
      recommended_action: "none",
      recurrence_30d: recurrence30d,
      recurrence_90d: recurrence90d,
      reasons,
    };
  }

  static buildProfileDecisions(events: TrustEvent[]): TrustPolicyDecision[] {
    const profiles = new Map<string, { profileId: string; role: TrustActorRole }>();

    for (const event of events) {
      profiles.set(`${event.subject_profile_id}:${event.subject_role}`, {
        profileId: event.subject_profile_id,
        role: event.subject_role,
      });
    }

    return Array.from(profiles.values())
      .map(({ profileId, role }) => this.evaluateProfile(profileId, role, events))
      .sort((left, right) => {
        if (left.summary.reliability_score !== right.summary.reliability_score) {
          return left.summary.reliability_score - right.summary.reliability_score;
        }
        return right.recurrence_30d - left.recurrence_30d;
      });
  }
}
