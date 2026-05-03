import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import {
  ADMIN_USER_REPORT_STATUS,
  type AdminUserReportStatus,
} from "@/core/admin/config/user-report-status";

export interface UserReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: AdminUserReportStatus;
  reporter_name: string;
  created_at: string;
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
      data = (await profileService.getProfilesByIds(profileIds)) as Array<{ id: string; name?: string | null }>;
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
