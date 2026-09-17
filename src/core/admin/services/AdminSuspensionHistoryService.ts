import type { DriverModerationEvent } from "@/core/mobility/services/DriverModerationEventsService";

export interface AdminSuspensionProfileSnapshot {
  user_id: string;
  is_suspended?: boolean | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  updated_at?: string | null;
}

export interface AdminSuspensionHistoryEntry {
  id: string;
  user_id: string;
  reason: string;
  suspended_at: string;
  suspended_until: string;
  suspended_by: string;
  suspended_by_name: string;
  lifted_at: string | null;
  lifted_by: string | null;
  is_active: boolean;
}

export class AdminSuspensionHistoryService {
  static build(
    profileId: string,
    profile: AdminSuspensionProfileSnapshot,
    moderationEvents: readonly DriverModerationEvent[],
    now = new Date(),
  ): AdminSuspensionHistoryEntry[] {
    const timeline = moderationEvents.filter(
      (event) => event.action === "suspended" || event.action === "reactivated",
    );

    if (timeline.length > 0) {
      const reactivationEvents = timeline
        .filter((event) => event.action === "reactivated")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

      return timeline
        .map((event) => {
          const nextReactivation =
            event.action === "suspended"
              ? reactivationEvents.find(
                  (reactivation) =>
                    new Date(reactivation.created_at).getTime() >
                    new Date(event.created_at).getTime(),
                )
              : undefined;
          const isActiveSuspension =
            event.action === "suspended" &&
            !nextReactivation &&
            Boolean(profile.is_suspended);
          const liftedEvent = event.action === "reactivated" ? event : nextReactivation;

          return {
            id: event.id,
            user_id: profile.user_id,
            reason:
              event.reason ||
              (event.action === "reactivated"
                ? "Suspensao removida"
                : "Suspensao aplicada"),
            suspended_at: event.created_at,
            suspended_until:
              isActiveSuspension && profile.suspended_until
                ? profile.suspended_until
                : "",
            suspended_by: event.admin_profile_id || "admin",
            suspended_by_name: event.admin_name || "Administrador",
            lifted_at: liftedEvent?.created_at ?? null,
            lifted_by: liftedEvent?.admin_profile_id ?? null,
            is_active: isActiveSuspension,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.suspended_at).getTime() - new Date(a.suspended_at).getTime(),
        );
    }

    if (!profile.is_suspended) return [];

    return [
      {
        id: `${profileId}-active-suspension`,
        user_id: profile.user_id,
        reason: profile.suspension_reason || "Suspensao ativa",
        suspended_at:
          profile.suspended_at || profile.updated_at || now.toISOString(),
        suspended_until: profile.suspended_until || "",
        suspended_by: "admin",
        suspended_by_name: "Administrador",
        lifted_at: null,
        lifted_by: null,
        is_active: true,
      },
    ];
  }
}
