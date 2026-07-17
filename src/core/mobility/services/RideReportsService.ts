import { supabase, type Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export type ReportType =
  | "safety_concern"
  | "driver_behavior"
  | "passenger_behavior"
  | "route_issue"
  | "payment_issue"
  | "vehicle_condition"
  | "cancellation_abuse"
  | "fraud_suspicion"
  | "other";

export type ReportSeverity = "low" | "medium" | "high" | "critical";
export type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed";
export type ReporterType = "passenger" | "driver" | "admin";

export interface RideReport {
  id: string;
  ride_id: string;
  reporter_profile_id: string;
  reporter_type: ReporterType;
  report_type: ReportType;
  severity: ReportSeverity;
  status: ReportStatus;
  title: string;
  description: string;
  evidence_urls?: string[];
  location_lat?: number;
  location_lng?: number;
  reported_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportInput {
  rideId: string;
  reportType: ReportType;
  severity: ReportSeverity;
  title: string;
  description: string;
  evidenceUrls?: string[];
  locationLat?: number;
  locationLng?: number;
}

export interface UpdateReportInput {
  status: Exclude<ReportStatus, "pending">;
  resolutionNotes?: string;
  adminNotes?: string;
}

type RideReportRow = Database["public"]["Tables"]["ride_reports"]["Row"];

function getEmptyReportStats() {
  return {
    total: 0,
    pending: 0,
    underReview: 0,
    resolved: 0,
    dismissed: 0,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    byType: {
      safety_concern: 0,
      driver_behavior: 0,
      passenger_behavior: 0,
      route_issue: 0,
      payment_issue: 0,
      vehicle_condition: 0,
      cancellation_abuse: 0,
      fraud_suspicion: 0,
      other: 0,
    },
  };
}

function normalizeRideReport(row: RideReportRow): RideReport {
  return {
    id: row.id,
    ride_id: row.ride_id,
    reporter_profile_id: row.reporter_profile_id,
    reporter_type: row.reporter_type as ReporterType,
    report_type: row.report_type as ReportType,
    severity: row.severity as ReportSeverity,
    status: row.status as ReportStatus,
    title: row.title,
    description: row.description,
    evidence_urls: row.evidence_urls ?? undefined,
    location_lat: row.location_lat ?? undefined,
    location_lng: row.location_lng ?? undefined,
    reported_at: row.reported_at,
    reviewed_by: row.reviewed_by ?? undefined,
    reviewed_at: row.reviewed_at ?? undefined,
    resolution_notes: row.resolution_notes ?? undefined,
    admin_notes: row.admin_notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class RideReportsService {
  static async createReport(
    input: CreateReportInput,
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      logger.info("RideReportsService.createReport", {
        rideId: input.rideId,
        reportType: input.reportType,
      });

      const { data, error } = await supabase.rpc("create_ride_report", {
        p_ride_id: input.rideId,
        p_report_type: input.reportType,
        p_severity: input.severity,
        p_title: input.title.trim(),
        p_description: input.description.trim(),
        p_evidence_urls: input.evidenceUrls,
        p_location_lat: input.locationLat,
        p_location_lng: input.locationLng,
      });

      if (error || !data?.id) {
        logger.error("RideReportsService.createReport - error", error);
        return { success: false, error: error?.message ?? "Erro ao criar report" };
      }

      logger.info("RideReportsService.createReport - success", { reportId: data.id });
      return { success: true, reportId: data.id };
    } catch (error) {
      logger.error("RideReportsService.createReport - exception", error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  static async listReports(filters?: {
    status?: ReportStatus;
    severity?: ReportSeverity;
    reportType?: ReportType;
    reporterProfileId?: string;
    rideId?: string;
    limit?: number;
    offset?: number;
  }): Promise<RideReport[]> {
    try {
      let query = supabase
        .from("ride_reports")
        .select("*")
        .order("reported_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.severity) query = query.eq("severity", filters.severity);
      if (filters?.reportType) query = query.eq("report_type", filters.reportType);
      if (filters?.reporterProfileId) {
        query = query.eq("reporter_profile_id", filters.reporterProfileId);
      }
      if (filters?.rideId) query = query.eq("ride_id", filters.rideId);
      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.offset !== undefined) {
        const limit = filters.limit ?? 10;
        query = query.range(filters.offset, filters.offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("RideReportsService.listReports - error", error);
        return [];
      }

      return (data ?? []).map(normalizeRideReport);
    } catch (error) {
      logger.error("RideReportsService.listReports - exception", error as Error);
      return [];
    }
  }

  static async getReportById(reportId: string): Promise<RideReport | null> {
    try {
      const { data, error } = await supabase
        .from("ride_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error || !data) {
        logger.error("RideReportsService.getReportById - error", error);
        return null;
      }

      return normalizeRideReport(data);
    } catch (error) {
      logger.error("RideReportsService.getReportById - exception", error as Error);
      return null;
    }
  }

  static async updateReport(reportId: string, updates: UpdateReportInput): Promise<void> {
    try {
      logger.info("RideReportsService.updateReport", {
        reportId,
        status: updates.status,
      });

      const { error } = await supabase.rpc("moderate_ride_report", {
        p_report_id: reportId,
        p_status: updates.status,
        p_resolution_notes: updates.resolutionNotes?.trim() || undefined,
        p_admin_notes: updates.adminNotes?.trim() || undefined,
      });

      if (error) {
        logger.error("RideReportsService.updateReport - error", error);
        throw error;
      }

      logger.info("RideReportsService.updateReport - success", { reportId });
    } catch (error) {
      logger.error("RideReportsService.updateReport - exception", error as Error);
      throw error;
    }
  }

  static async getReportStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    resolved: number;
    dismissed: number;
    bySeverity: Record<ReportSeverity, number>;
    byType: Record<ReportType, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from("ride_reports")
        .select("status, severity, report_type");

      if (error || !data) {
        logger.error("RideReportsService.getReportStats - error", error);
        return getEmptyReportStats();
      }

      return {
        total: data.length,
        pending: data.filter((report) => report.status === "pending").length,
        underReview: data.filter((report) => report.status === "under_review").length,
        resolved: data.filter((report) => report.status === "resolved").length,
        dismissed: data.filter((report) => report.status === "dismissed").length,
        bySeverity: {
          low: data.filter((report) => report.severity === "low").length,
          medium: data.filter((report) => report.severity === "medium").length,
          high: data.filter((report) => report.severity === "high").length,
          critical: data.filter((report) => report.severity === "critical").length,
        },
        byType: {
          safety_concern: data.filter((report) => report.report_type === "safety_concern").length,
          driver_behavior: data.filter((report) => report.report_type === "driver_behavior").length,
          passenger_behavior: data.filter((report) => report.report_type === "passenger_behavior").length,
          route_issue: data.filter((report) => report.report_type === "route_issue").length,
          payment_issue: data.filter((report) => report.report_type === "payment_issue").length,
          vehicle_condition: data.filter((report) => report.report_type === "vehicle_condition").length,
          cancellation_abuse: data.filter((report) => report.report_type === "cancellation_abuse").length,
          fraud_suspicion: data.filter((report) => report.report_type === "fraud_suspicion").length,
          other: data.filter((report) => report.report_type === "other").length,
        },
      };
    } catch (error) {
      logger.error("RideReportsService.getReportStats - exception", error as Error);
      return getEmptyReportStats();
    }
  }
}
