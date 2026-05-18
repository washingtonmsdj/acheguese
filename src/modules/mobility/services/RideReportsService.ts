/**
 * RideReportsService - Serviço para gestão de reports de corridas
 * 
 * SSOT: ride_reports como fonte única de reports
 * Funcionalidades:
 * - Criar report (passenger/driver)
 * - Listar reports (admin/próprios)
 * - Atualizar status (admin)
 * - Adicionar notas de resolução (admin)
 */

import { supabase } from "@/core/infrastructure/supabase/supabase";
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
  reporterProfileId: string;
  reporterType: ReporterType;
  reportType: ReportType;
  severity: ReportSeverity;
  title: string;
  description: string;
  evidenceUrls?: string[];
  locationLat?: number;
  locationLng?: number;
}

export interface UpdateReportInput {
  status?: ReportStatus;
  reviewedBy?: string;
  resolutionNotes?: string;
  adminNotes?: string;
}

export class RideReportsService {
  /**
   * Criar novo report
   */
  static async createReport(input: CreateReportInput): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      logger.info("RideReportsService.createReport", { rideId: input.rideId, reportType: input.reportType });

      const { data, error } = await (supabase as any)
        .from("ride_reports")
        .insert({
          ride_id: input.rideId,
          reporter_profile_id: input.reporterProfileId,
          reporter_type: input.reporterType,
          report_type: input.reportType,
          severity: input.severity,
          title: input.title,
          description: input.description,
          evidence_urls: input.evidenceUrls,
          location_lat: input.locationLat,
          location_lng: input.locationLng,
        })
        .select("id")
        .single();

      if (error) {
        logger.error("RideReportsService.createReport - error", error);
        return { success: false, error: error.message };
      }

      logger.info("RideReportsService.createReport - success", { reportId: data.id });
      return { success: true, reportId: data.id };
    } catch (error) {
      logger.error("RideReportsService.createReport - exception", error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Listar reports (admin ou próprios)
   */
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

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }

      if (filters?.reportType) {
        query = query.eq("report_type", filters.reportType);
      }

      if (filters?.reporterProfileId) {
        query = query.eq("reporter_profile_id", filters.reporterProfileId);
      }

      if (filters?.rideId) {
        query = query.eq("ride_id", filters.rideId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("RideReportsService.listReports - error", error);
        return [];
      }

      return (data || []) as RideReport[];
    } catch (error) {
      logger.error("RideReportsService.listReports - exception", error as Error);
      return [];
    }
  }

  /**
   * Obter report por ID
   */
  static async getReportById(reportId: string): Promise<RideReport | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("ride_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) {
        logger.error("RideReportsService.getReportById - error", error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error("RideReportsService.getReportById - exception", error as Error);
      return null;
    }
  }

  /**
   * Atualizar report (admin)
   */
  static async updateReport(
    reportId: string,
    updates: UpdateReportInput,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("RideReportsService.updateReport", { reportId, updates });

      const updateData: Record<string, unknown> = {};

      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === "under_review" || updates.status === "resolved" || updates.status === "dismissed") {
          updateData.reviewed_at = new Date().toISOString();
        }
      }

      if (updates.reviewedBy) {
        updateData.reviewed_by = updates.reviewedBy;
      }

      if (updates.resolutionNotes) {
        updateData.resolution_notes = updates.resolutionNotes;
      }

      if (updates.adminNotes) {
        updateData.admin_notes = updates.adminNotes;
      }

      const { error } = await (supabase as any)
        .from("ride_reports")
        .update(updateData)
        .eq("id", reportId);

      if (error) {
        logger.error("RideReportsService.updateReport - error", error);
        return { success: false, error: error.message };
      }

      logger.info("RideReportsService.updateReport - success", { reportId });
      return { success: true };
    } catch (error) {
      logger.error("RideReportsService.updateReport - exception", error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Obter estatísticas de reports
   */
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
      const { data, error } = await (supabase as any).from("ride_reports").select("status, severity, report_type");

      if (error) {
        logger.error("RideReportsService.getReportStats - error", error);
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

      const stats = {
        total: data.length,
        pending: data.filter((r) => r.status === "pending").length,
        underReview: data.filter((r) => r.status === "under_review").length,
        resolved: data.filter((r) => r.status === "resolved").length,
        dismissed: data.filter((r) => r.status === "dismissed").length,
        bySeverity: {
          low: data.filter((r) => r.severity === "low").length,
          medium: data.filter((r) => r.severity === "medium").length,
          high: data.filter((r) => r.severity === "high").length,
          critical: data.filter((r) => r.severity === "critical").length,
        },
        byType: {
          safety_concern: data.filter((r) => r.report_type === "safety_concern").length,
          driver_behavior: data.filter((r) => r.report_type === "driver_behavior").length,
          passenger_behavior: data.filter((r) => r.report_type === "passenger_behavior").length,
          route_issue: data.filter((r) => r.report_type === "route_issue").length,
          payment_issue: data.filter((r) => r.report_type === "payment_issue").length,
          vehicle_condition: data.filter((r) => r.report_type === "vehicle_condition").length,
          cancellation_abuse: data.filter((r) => r.report_type === "cancellation_abuse").length,
          fraud_suspicion: data.filter((r) => r.report_type === "fraud_suspicion").length,
          other: data.filter((r) => r.report_type === "other").length,
        },
      };

      return stats;
    } catch (error) {
      logger.error("RideReportsService.getReportStats - exception", error as Error);
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
  }
}




