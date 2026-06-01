/**
 *  ClassifiedReportService - Servio de denncias de classificados
 *
 *  Gerencia denncias de anncios suspeitos ou inadequados.
 *  Armazena em classified_reports e notifica administradores.
 */

import { supabase } from "@/integrations/supabase";
import { REPORT_STATUS, type ReportStatus } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export type ReportReason = 
  | "fraud"
  | "fake"
  | "inappropriate"
  | "spam"
  | "duplicate"
  | "wrong-category"
  | "sold"
  | "other";

export const CLASSIFIED_REPORT_REASON_OPTIONS: readonly {
  id: ReportReason;
  label: string;
}[] = [
  { id: "fraud", label: "Fraude ou golpe" },
  { id: "fake", label: "Produto falso" },
  { id: "inappropriate", label: "Conteudo inapropriado" },
  { id: "spam", label: "Spam" },
  { id: "duplicate", label: "Duplicado" },
  { id: "wrong-category", label: "Categoria incorreta" },
  { id: "sold", label: "Ja vendido" },
  { id: "other", label: "Outro" },
] as const;

export function isClassifiedReportReason(value: string): value is ReportReason {
  return CLASSIFIED_REPORT_REASON_OPTIONS.some((reason) => reason.id === value);
}

export interface ClassifiedReport {
  id: string;
  classified_id: string;
  reporter_id: string | null;
  reason: ReportReason;
  description?: string;
  status: Extract<
    ReportStatus,
    | typeof REPORT_STATUS.PENDING
    | typeof REPORT_STATUS.REVIEWED
    | typeof REPORT_STATUS.RESOLVED
    | typeof REPORT_STATUS.DISMISSED
  >;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
}

export interface CreateReportInput {
  classified_id: string;
  reason: ReportReason;
  description?: string;
}

function mapReport(row: Record<string, unknown>): ClassifiedReport {
  return {
    ...(row as unknown as ClassifiedReport),
    reason: (row.reason as ReportReason) ?? "other",
  };
}

class ClassifiedReportServiceClass {
  /**
   *  Cria uma nova denncia
   */
  async createReport(
    reporterProfileId: string,
    input: CreateReportInput
  ): Promise<ClassifiedReport> {
    try {
      if (!isClassifiedReportReason(input.reason)) {
        throw new Error("Motivo de denuncia invalido.");
      }

      const { data, error } = await supabase
        .from("classified_reports")
        .insert({
          classified_id: input.classified_id,
          reporter_id: reporterProfileId,
          reason: input.reason,
          description: input.description,
          status: REPORT_STATUS.PENDING,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating classified report:", error);
        throw error;
      }

      logger.info("Classified report created:", {
        reportId: data.id,
        classifiedId: input.classified_id,
        reason: input.reason,
      });

      return mapReport(data as Record<string, unknown>);
    } catch (error) {
      logger.error("Error in createReport:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "createReport",
      });
      throw error;
    }
  }

  /**
   *  Busca todas as denncias (admin)
   */
  async getAllReports(filters?: {
    status?: string;
    limit?: number;
  }): Promise<ClassifiedReport[]> {
    try {
      let query = supabase
        .from("classified_reports")
        .select(`
          * ,
          classified:classifieds(id, title, seller_id),
          reporter:profiles!reporter_id(id, name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching classified reports:", error);
        throw error;
      }

      return (data || []).map((item) => mapReport(item as Record<string, unknown>));
    } catch (error) {
      logger.error("Error in getAllReports:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "getAllReports",
      });
      throw error;
    }
  }

  /**
   *  Busca denncias de um classificado especfico
   */
  async getReportsByClassified(classifiedId: string): Promise<ClassifiedReport[]> {
    try {
      const { data, error } = await supabase
        .from("classified_reports")
        .select(`
          * ,
          reporter:profiles!reporter_id(id, name, avatar_url)
        `)
        .eq("classified_id", classifiedId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching reports by classified:", error);
        throw error;
      }

      return (data || []).map((item) => mapReport(item as Record<string, unknown>));
    } catch (error) {
      logger.error("Error in getReportsByClassified:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "getReportsByClassified",
      });
      throw error;
    }
  }

  /**
   *  Atualiza status de uma denncia (admin)
   */
  async updateReportStatus(
    reportId: string,
    adminId: string,
    status: "reviewed" | "resolved" | "dismissed",
    adminNotes?: string
  ): Promise<ClassifiedReport> {
    try {
      const { data, error } = await supabase
        .from("classified_reports")
        .update({
          status,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", reportId)
        .select()
        .single();

      if (error) {
        logger.error("Error updating report status:", error);
        throw error;
      }

      logger.info("Report status updated:", {
        reportId,
        status,
        adminId,
      });

      return mapReport(data as Record<string, unknown>);
    } catch (error) {
      logger.error("Error in updateReportStatus:", error);
      trackError(error as Error, {
        component: "ClassifiedReportService",
        action: "updateReportStatus",
      });
      throw error;
    }
  }

  /**
   *  Conta denncias pendentes (admin dashboard)
   */
  async getPendingReportsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("classified_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", REPORT_STATUS.PENDING);

      if (error) {
        logger.error("Error counting pending reports:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error("Error in getPendingReportsCount:", error);
      return 0;
    }
  }

  /**
   *  Busca denncias recentes (admin dashboard)
   */
  async getRecentReports(limit = 10): Promise<ClassifiedReport[]> {
    try {
      const { data, error } = await supabase
        .from("classified_reports")
        .select(`
          * ,
          classified:classifieds(id, title, seller_id),
          reporter:profiles!reporter_id(id, name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Error fetching recent reports:", error);
        return [];
      }

      return (data || []).map((item) => mapReport(item as Record<string, unknown>));
    } catch (error) {
      logger.error("Error in getRecentReports:", error);
      return [];
    }
  }
}

export const classifiedReportService = new ClassifiedReportServiceClass();
