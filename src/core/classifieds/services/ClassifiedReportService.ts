import { supabase } from "@/integrations/supabase";
import { REPORT_STATUS, type ReportStatus } from "@/shared/types/constants";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import {
  isReportReason,
  type ReportReasonOption,
} from "@/core/moderation/reportReasons";

export type ReportReason =
  | "fraud"
  | "fake"
  | "inappropriate"
  | "spam"
  | "duplicate"
  | "wrong-category"
  | "sold"
  | "other";

export const CLASSIFIED_REPORT_REASON_OPTIONS = [
  { id: "fraud", label: "Fraude ou golpe" },
  { id: "fake", label: "Produto falso" },
  { id: "inappropriate", label: "Conteudo inapropriado" },
  { id: "spam", label: "Spam" },
  { id: "duplicate", label: "Duplicado" },
  { id: "wrong-category", label: "Categoria incorreta" },
  { id: "sold", label: "Ja vendido" },
  { id: "other", label: "Outro" },
] as const satisfies readonly ReportReasonOption<ReportReason>[];

export function isClassifiedReportReason(value: string): value is ReportReason {
  return isReportReason(CLASSIFIED_REPORT_REASON_OPTIONS, value);
}

export interface ClassifiedReport {
  id: string;
  classified_id: string;
  reporter_id: string;
  reason: ReportReason;
  description: string | null;
  status: Extract<
    ReportStatus,
    | typeof REPORT_STATUS.PENDING
    | typeof REPORT_STATUS.REVIEWED
    | typeof REPORT_STATUS.RESOLVED
    | typeof REPORT_STATUS.DISMISSED
  >;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
}

export interface CreateReportInput {
  classified_id: string;
  reason: ReportReason;
  description?: string;
}

export type ClassifiedReportModerationStatus = Extract<
  ClassifiedReport["status"],
  | typeof REPORT_STATUS.REVIEWED
  | typeof REPORT_STATUS.RESOLVED
  | typeof REPORT_STATUS.DISMISSED
>;

type ClassifiedReportRpcRow = Omit<ClassifiedReport, "reason" | "status"> & {
  reason: string;
  status: string;
};

function mapReport(row: ClassifiedReportRpcRow): ClassifiedReport {
  if (!isClassifiedReportReason(row.reason)) {
    throw new Error("Motivo de denuncia persistido e invalido.");
  }

  return {
    ...row,
    reason: row.reason,
    status: row.status as ClassifiedReport["status"],
  };
}

class ClassifiedReportServiceClass {
  async createReport(input: CreateReportInput): Promise<ClassifiedReport> {
    try {
      if (!isClassifiedReportReason(input.reason)) {
        throw new Error("Motivo de denuncia invalido.");
      }

      const { data, error } = await supabase.rpc("create_classified_report", {
        p_classified_id: input.classified_id,
        p_reason: input.reason,
        p_description: input.description?.trim() || undefined,
      });

      if (error || !data) {
        logger.error("Error creating classified report:", error);
        throw error ?? new Error("Denuncia nao retornada pelo servidor.");
      }

      logger.info("Classified report created:", {
        reportId: data.id,
        classifiedId: input.classified_id,
        reason: input.reason,
      });

      return mapReport(data);
    } catch (error) {
      logger.error("Error in createReport:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "createReport",
      });
      throw error;
    }
  }

  async updateReportStatus(
    reportId: string,
    status: ClassifiedReportModerationStatus,
    adminNotes?: string,
  ): Promise<ClassifiedReport> {
    try {
      const { data, error } = await supabase.rpc("moderate_classified_report", {
        p_report_id: reportId,
        p_status: status,
        p_admin_notes: adminNotes?.trim() || undefined,
      });

      if (error || !data) {
        logger.error("Error updating classified report:", error);
        throw error ?? new Error("Denuncia nao retornada pelo servidor.");
      }

      return mapReport(data);
    } catch (error) {
      logger.error("Error in updateReportStatus:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "updateReportStatus",
      });
      throw error;
    }
  }

  async getPendingReportsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("classified_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", REPORT_STATUS.PENDING);

      if (error) {
        logger.error("Error counting pending reports:", error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      logger.error("Error in getPendingReportsCount:", error);
      return 0;
    }
  }
}

export const classifiedReportService = new ClassifiedReportServiceClass();
