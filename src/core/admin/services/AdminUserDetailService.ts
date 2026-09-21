import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import {
  ADMIN_USER_REPORT_STATUS,
  type AdminUserReportStatus,
} from "@/core/admin/config/user-report-status";
import {
  AdminDriverDetailReadService,
  type AdminDriverDetail,
} from "@/core/admin/services/AdminDriverDetailReadService";
import { DriverModerationEventsService } from "@/core/mobility/services/runtime";

export interface UserReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: AdminUserReportStatus;
  reporter_name: string;
  created_at: string;
}

export interface AdminSuspensionHistory {
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

export interface AdminModerationProfileSnapshot {
  id: string;
  user_id: string;
  profile_type: string | null;
  is_suspended?: boolean | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  updated_at?: string | null;
}

type RideReportRow = {
  id: string;
  title: string | null;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string | null;
  reported_at: string | null;
  reporter_profile_id: string | null;
};

const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: string; message?: string; details?: string };
  if (candidate.code && MISSING_TABLE_ERROR_CODES.has(candidate.code)) return true;

  const text = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  return text.includes("does not exist") || text.includes("relation");
}

function normalizeSeverity(value: string | null | undefined): UserReport["severity"] {
  if (value === "low" || value === "medium" || value === "high" || value === "critical") {
    return value;
  }
  return "medium";
}

function normalizeStatus(value: string | null | undefined): UserReport["status"] {
  if (value === "under_review") return ADMIN_USER_REPORT_STATUS.INVESTIGATING;
  if (value === ADMIN_USER_REPORT_STATUS.PENDING) return ADMIN_USER_REPORT_STATUS.PENDING;
  if (value === ADMIN_USER_REPORT_STATUS.RESOLVED) return ADMIN_USER_REPORT_STATUS.RESOLVED;
  if (value === ADMIN_USER_REPORT_STATUS.DISMISSED) return ADMIN_USER_REPORT_STATUS.DISMISSED;
  return ADMIN_USER_REPORT_STATUS.PENDING;
}

function toUserReport(row: RideReportRow, namesByProfileId: Map<string, string>): UserReport {
  return {
    id: row.id,
    title: row.title || "Report",
    description: row.description || "",
    severity: normalizeSeverity(row.severity),
    status: normalizeStatus(row.status),
    reporter_name:
      (row.reporter_profile_id && namesByProfileId.get(row.reporter_profile_id)) || "Usuario",
    created_at: row.reported_at || row.created_at || new Date().toISOString(),
  };
}

export class AdminUserDetailService {
  static async loadModerationContext(
    profile: AdminModerationProfileSnapshot,
  ): Promise<{
    driverData: AdminDriverDetail | null;
    suspensionHistory: AdminSuspensionHistory[];
  }> {
    const isDriver = profile.profile_type === "driver";

    const [driverData, moderationEvents] = await Promise.all([
      isDriver ? AdminDriverDetailReadService.get(profile.id) : Promise.resolve(null),
      isDriver
        ? DriverModerationEventsService.listByDriverProfile(profile.id)
        : Promise.resolve([]),
    ]);

    const moderationTimeline = moderationEvents.filter(
      (event) => event.action === "suspended" || event.action === "reactivated",
    );

    if (moderationTimeline.length > 0) {
      const reactivationEvents = moderationTimeline
        .filter((event) => event.action === "reactivated")
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

      const history = moderationTimeline.map((event) => {
        const nextReactivation = reactivationEvents.find(
          (reactivation) =>
            new Date(reactivation.created_at).getTime() >
            new Date(event.created_at).getTime(),
        );

        const isSuspensionEvent = event.action === "suspended";
        const isActiveSuspension =
          isSuspensionEvent && !nextReactivation && Boolean(profile.is_suspended);

        const liftedAt =
          nextReactivation?.created_at ||
          (event.action === "reactivated" ? event.created_at : null);
        const liftedBy =
          nextReactivation?.admin_profile_id ||
          (event.action === "reactivated" ? event.admin_profile_id : null);

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
          lifted_at: liftedAt,
          lifted_by: liftedBy,
          is_active: isActiveSuspension,
        } satisfies AdminSuspensionHistory;
      });

      return {
        driverData,
        suspensionHistory: history.sort(
          (a, b) =>
            new Date(b.suspended_at).getTime() - new Date(a.suspended_at).getTime(),
        ),
      };
    }

    if (profile.is_suspended) {
      return {
        driverData,
        suspensionHistory: [
          {
            id: `${profile.id}-active-suspension`,
            user_id: profile.user_id,
            reason: profile.suspension_reason || "Suspensao ativa",
            suspended_at:
              profile.suspended_at ||
              profile.updated_at ||
              new Date().toISOString(),
            suspended_until: profile.suspended_until || "",
            suspended_by: "admin",
            suspended_by_name: "Administrador",
            lifted_at: null,
            lifted_by: null,
            is_active: true,
          },
        ],
      };
    }

    return { driverData, suspensionHistory: [] };
  }

  static async loadRideReports(userId: string): Promise<{
    reportsMade: UserReport[];
    reportsReceived: UserReport[];
  }> {
    const selectReportFields =
      "id, title, description, severity, status, created_at, reported_at, reporter_profile_id";

    const [reportsMadeResult, reportsReceivedAsPassengerResult, reportsReceivedAsDriverResult] =
      await Promise.all([
        supabase
          .from("ride_reports")
          .select(selectReportFields)
          .eq("reporter_profile_id", userId)
          .order("reported_at", { ascending: false }),
        supabase
          .from("ride_reports")
          .select(`${selectReportFields}, ride_requests!inner(passenger_profile_id)`)
          .eq("ride_requests.passenger_profile_id", userId)
          .neq("reporter_profile_id", userId)
          .order("reported_at", { ascending: false }),
        supabase
          .from("ride_reports")
          .select(`${selectReportFields}, ride_requests!inner(driver_profile_id)`)
          .eq("ride_requests.driver_profile_id", userId)
          .neq("reporter_profile_id", userId)
          .order("reported_at", { ascending: false }),
      ]);

    const reportErrors = [
      reportsMadeResult.error,
      reportsReceivedAsPassengerResult.error,
      reportsReceivedAsDriverResult.error,
    ].filter(Boolean);

    if (reportErrors.length > 0) {
      const hasOnlyMissingTableErrors = reportErrors.every((item) => isMissingTableError(item));
      if (!hasOnlyMissingTableErrors) {
        logger.warn("AdminUserDetailService.loadRideReports", reportErrors);
      }
    }

    const reportsMadeRows = ((reportsMadeResult.data || []) as RideReportRow[]) ?? [];
    const receivedRowsMap = new Map<string, RideReportRow>();

    for (const row of ((reportsReceivedAsPassengerResult.data || []) as RideReportRow[]) ?? []) {
      if (row?.id) receivedRowsMap.set(row.id, row);
    }

    for (const row of ((reportsReceivedAsDriverResult.data || []) as RideReportRow[]) ?? []) {
      if (row?.id) receivedRowsMap.set(row.id, row);
    }

    const reportsReceivedRows = Array.from(receivedRowsMap.values());
    const reporterIds = Array.from(
      new Set(
        [...reportsMadeRows, ...reportsReceivedRows]
          .map((report) => report.reporter_profile_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    );

    const namesByProfileId = await this.loadReporterNames(reporterIds);

    return {
      reportsMade: reportsMadeRows
        .map((row) => toUserReport(row, namesByProfileId))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      reportsReceived: reportsReceivedRows
        .map((row) => toUserReport(row, namesByProfileId))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    };
  }

  private static async loadReporterNames(profileIds: string[]): Promise<Map<string, string>> {
    if (profileIds.length === 0) return new Map<string, string>();

    let data: Array<{ id: string; name?: string | null }> = [];
    try {
      data = (await profileService.getAccessibleProfilesByIds(profileIds)) as Array<{ id: string; name?: string | null }>;
    } catch (error) {
      logger.warn("AdminUserDetailService.loadReporterNames", error);
      return new Map<string, string>();
    }

    const names = new Map<string, string>();
    for (const item of (data || []) as Array<{ id: string; name?: string | null }>) {
      names.set(item.id, item.name || "Usuario");
    }
    return names;
  }
}
