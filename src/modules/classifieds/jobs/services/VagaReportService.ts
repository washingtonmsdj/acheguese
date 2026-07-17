import { supabase } from "@/integrations/supabase";
import { REPORT_STATUS, type ReportStatus } from "@/shared/types/constants";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import {
  isReportReason,
  type ReportReasonOption,
} from "@/core/moderation/reportReasons";

export type VagaReportReason =
  | "fraud"
  | "fake-company"
  | "inappropriate"
  | "spam"
  | "expired"
  | "misleading"
  | "discrimination"
  | "other";

export const VAGA_REPORT_REASON_OPTIONS = [
  { id: "fraud", label: "Fraude ou golpe" },
  { id: "fake-company", label: "Empresa falsa" },
  { id: "inappropriate", label: "Conteudo inapropriado" },
  { id: "spam", label: "Spam" },
  { id: "expired", label: "Vaga expirada" },
  { id: "misleading", label: "Informacao enganosa" },
  { id: "discrimination", label: "Conteudo discriminatorio" },
  { id: "other", label: "Outro" },
] as const satisfies readonly ReportReasonOption<VagaReportReason>[];

export function isVagaReportReason(value: string): value is VagaReportReason {
  return isReportReason(VAGA_REPORT_REASON_OPTIONS, value);
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

export type VagaReportModerationStatus = Extract<
  VagaReport["status"],
  | typeof REPORT_STATUS.REVIEWED
  | typeof REPORT_STATUS.RESOLVED
  | typeof REPORT_STATUS.DISMISSED
>;

type VagaReportRpcRow = Omit<VagaReport, "reason" | "status"> & {
  reason: string;
  status: string;
};

function mapReport(row: VagaReportRpcRow): VagaReport {
  if (!isVagaReportReason(row.reason)) {
    throw new Error("Motivo de denuncia persistido e invalido.");
  }

  return {
    ...row,
    reason: row.reason,
    status: row.status as VagaReport["status"],
  };
}

export class VagaReportService {
  static async createReport(input: CreateVagaReportInput): Promise<VagaReport> {
    try {
      if (!isVagaReportReason(input.reason)) {
        throw new Error("Motivo de denuncia invalido.");
      }

      const { data, error } = await supabase.rpc("create_vaga_report", {
        p_vaga_id: input.vagaId,
        p_reason: input.reason,
        p_description: input.description?.trim() || undefined,
      });

      if (error || !data) {
        if (error?.code === "23505") {
          throw new Error("Voce ja enviou uma denuncia para esta vaga.");
        }
        logger.error(
          "[VagaReportService] Erro ao criar denuncia de vaga:",
          error,
        );
        throw error ?? new Error("Denuncia nao retornada pelo servidor.");
      }

      logger.info("[VagaReportService] Denuncia de vaga criada", {
        reportId: data.id,
        vagaId: input.vagaId,
        reason: input.reason,
      });

      return mapReport(data);
    } catch (error) {
      logger.error(
        "[VagaReportService] Erro inesperado ao criar denuncia:",
        error,
      );
      trackError(error as Error, {
        component: "VagaReportService",
        action: "createReport",
      });
      throw error;
    }
  }

  static async updateReportStatus(
    reportId: string,
    status: VagaReportModerationStatus,
    adminNotes?: string,
  ): Promise<VagaReport> {
    try {
      const { data, error } = await supabase.rpc("moderate_vaga_report", {
        p_report_id: reportId,
        p_status: status,
        p_admin_notes: adminNotes?.trim() || undefined,
      });

      if (error || !data) {
        logger.error(
          "[VagaReportService] Erro ao atualizar denuncia de vaga:",
          error,
        );
        throw error ?? new Error("Denuncia nao retornada pelo servidor.");
      }

      return mapReport(data);
    } catch (error) {
      logger.error(
        "[VagaReportService] Erro inesperado ao atualizar denuncia:",
        error,
      );
      trackError(error as Error, {
        component: "VagaReportService",
        action: "updateReportStatus",
      });
      throw error;
    }
  }
}

export const vagaReportService = VagaReportService;
