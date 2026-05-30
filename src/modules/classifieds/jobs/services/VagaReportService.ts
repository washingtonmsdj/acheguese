import { supabase } from "@/core/infrastructure/supabase/supabase";
import { REPORT_STATUS, type ReportStatus } from "@/shared/types/constants";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import { JOB_FORM_LIMITS } from "../constants/form-limits";

export type VagaReportReason =
  | "fraud"
  | "fake-company"
  | "inappropriate"
  | "spam"
  | "expired"
  | "misleading"
  | "discrimination"
  | "other";

export const VAGA_REPORT_REASON_OPTIONS: readonly {
  id: VagaReportReason;
  label: string;
}[] = [
  { id: "fraud", label: "Fraude ou golpe" },
  { id: "fake-company", label: "Empresa falsa" },
  { id: "inappropriate", label: "Conteudo inapropriado" },
  { id: "spam", label: "Spam" },
  { id: "expired", label: "Vaga expirada" },
  { id: "misleading", label: "Informacao enganosa" },
  { id: "discrimination", label: "Conteudo discriminatorio" },
  { id: "other", label: "Outro" },
] as const;

export function isVagaReportReason(value: string): value is VagaReportReason {
  return VAGA_REPORT_REASON_OPTIONS.some((reason) => reason.id === value);
}

export interface VagaReport {
  id: string;
  vaga_id: string;
  reporter_profile_id: string;
  reason: VagaReportReason;
  description: string | null;
  status: Extract<
    ReportStatus,
    | typeof REPORT_STATUS.PENDING
    | typeof REPORT_STATUS.REVIEWED
    | typeof REPORT_STATUS.RESOLVED
    | typeof REPORT_STATUS.DISMISSED
  >;
  reviewed_by_profile_id: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVagaReportInput {
  vagaId: string;
  reason: VagaReportReason;
  description?: string;
}

function normalizeDescription(description?: string): string | null {
  const value = description?.trim();
  if (!value) return null;
  return value.slice(0, JOB_FORM_LIMITS.MAX_REPORT_DESCRIPTION);
}

function mapReport(row: Record<string, unknown>): VagaReport {
  return {
    ...(row as unknown as VagaReport),
    reason: (row.reason as VagaReportReason) ?? "other",
  };
}

export class VagaReportService {
  static async createReport(
    reporterProfileId: string,
    input: CreateVagaReportInput,
  ): Promise<VagaReport> {
    try {
      if (!isVagaReportReason(input.reason)) {
        throw new Error("Motivo de denuncia invalido.");
      }

      const { data, error } = await (supabase as any)
        .from("vaga_reports")
        .insert({
          vaga_id: input.vagaId,
          reporter_profile_id: reporterProfileId,
          reason: input.reason,
          description: normalizeDescription(input.description),
          status: REPORT_STATUS.PENDING,
        })
        .select("*")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Voce ja enviou uma denuncia pendente para esta vaga.");
        }
        logger.error("[VagaReportService] Erro ao criar denuncia de vaga:", error);
        throw error;
      }

      logger.info("[VagaReportService] Denuncia de vaga criada", {
        reportId: data.id,
        vagaId: input.vagaId,
        reason: input.reason,
      });

      return mapReport(data as Record<string, unknown>);
    } catch (error) {
      logger.error("[VagaReportService] Erro inesperado ao criar denuncia:", error);
      trackError(error as Error, {
        component: "VagaReportService",
        action: "createReport",
      });
      throw error;
    }
  }

  static async getReportsByVaga(vagaId: string): Promise<VagaReport[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("vaga_reports")
        .select(`
          *,
          reporter:profiles!reporter_profile_id(id, name, avatar_url)
        `)
        .eq("vaga_id", vagaId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("[VagaReportService] Erro ao buscar denuncias da vaga:", error);
        throw error;
      }

      return ((data ?? []) as Record<string, unknown>[]).map(mapReport);
    } catch (error) {
      logger.error("[VagaReportService] Erro inesperado ao buscar denuncias:", error);
      trackError(error as Error, {
        component: "VagaReportService",
        action: "getReportsByVaga",
      });
      throw error;
    }
  }

  static async updateReportStatus(
    reportId: string,
    adminProfileId: string,
    status: "reviewed" | "resolved" | "dismissed",
    adminNotes?: string,
  ): Promise<VagaReport> {
    try {
      const { data, error } = await (supabase as any)
        .from("vaga_reports")
        .update({
          status,
          reviewed_by_profile_id: adminProfileId,
          reviewed_at: new Date().toISOString(),
          admin_notes: normalizeDescription(adminNotes),
        })
        .eq("id", reportId)
        .select("*")
        .single();

      if (error) {
        logger.error("[VagaReportService] Erro ao atualizar denuncia de vaga:", error);
        throw error;
      }

      return mapReport(data as Record<string, unknown>);
    } catch (error) {
      logger.error("[VagaReportService] Erro inesperado ao atualizar denuncia:", error);
      trackError(error as Error, {
        component: "VagaReportService",
        action: "updateReportStatus",
      });
      throw error;
    }
  }
}

export const vagaReportService = VagaReportService;
