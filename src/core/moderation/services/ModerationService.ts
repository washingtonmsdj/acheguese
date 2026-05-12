/**
 * MODERATION SERVICE - SSOT para Sistema de Moderacao
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { MODERATION_REPORT_STATUS } from "@/core/moderation/constants/reportStatus";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";

interface ReportContentInput {
  targetType: "post" | "comment" | "profile";
  targetId: string;
  reporterId: string;
  reason: string;
  details?: string;
}

type ModerationTarget = "post" | "comment" | "profile";

type ModerationReportRow = {
  id: string;
  created_at?: string;
  [key: string]: unknown;
};

type CombinedModerationReport = ModerationReportRow & { type: ModerationTarget };

type SupabaseErrorLike = {
  message?: string;
  code?: string;
};

class ModerationServiceClass {
  private tableMap = {
    post: "posts",
    comment: "comments",
    profile: "profiles",
  } as const;

  private idFieldMap = {
    post: "post_id",
    comment: "comment_id",
    profile: "profile_id",
  } as const;

  private db(): AdminSupabaseClient {
    return supabase as unknown as AdminSupabaseClient;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null) {
      return (error as SupabaseErrorLike).message || fallback;
    }
    return fallback;
  }

  private getTableByTarget(targetType: ModerationTarget): string {
    switch (targetType) {
      case "post":
        return this.tableMap.post;
      case "comment":
        return this.tableMap.comment;
      case "profile":
        return this.tableMap.profile;
      default:
        return this.tableMap.post;
    }
  }

  private getIdFieldByTarget(targetType: ModerationTarget): string {
    switch (targetType) {
      case "post":
        return this.idFieldMap.post;
      case "comment":
        return this.idFieldMap.comment;
      case "profile":
        return this.idFieldMap.profile;
      default:
        return this.idFieldMap.post;
    }
  }

  async reportContent(input: ReportContentInput): Promise<void> {
    try {
      const table = this.getTableByTarget(input.targetType);
      const idField = this.getIdFieldByTarget(input.targetType);

      const { error } = await this.db().from(table).insert({
        [idField]: input.targetId,
        reporter_id: input.reporterId,
        motivo: input.reason,
        detalhes: input.details || "",
      });

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error reporting content:", error);
      throw new Error(`Erro ao enviar denuncia: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async getPendingReports(
    targetType?: ModerationTarget,
  ): Promise<CombinedModerationReport[] | ModerationReportRow[]> {
    try {
      if (targetType) {
        const table = this.getTableByTarget(targetType);
        const { data, error } = await this.db()
          .from(table)
          .select("*")
          .eq("status", MODERATION_REPORT_STATUS.PENDING)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as ModerationReportRow[];
      }

      const [posts, comments, profiles] = await Promise.all([
        this.getPendingReports("post"),
        this.getPendingReports("comment"),
        this.getPendingReports("profile"),
      ]);

      return [
        ...(posts as ModerationReportRow[]).map((r) => ({ ...r, type: "post" as const })),
        ...(comments as ModerationReportRow[]).map((r) => ({ ...r, type: "comment" as const })),
        ...(profiles as ModerationReportRow[]).map((r) => ({ ...r, type: "profile" as const })),
      ].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
    } catch (error: unknown) {
      logger.error("Error fetching pending reports:", error);
      return [];
    }
  }

  async approveReport(reportId: string, targetType: ModerationTarget): Promise<void> {
    try {
      const table = this.getTableByTarget(targetType);
      const { error } = await this.db()
        .from(table)
        .update({
          status: MODERATION_REPORT_STATUS.APPROVED,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error approving report:", error);
      throw new Error(`Erro ao aprovar denuncia: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async rejectReport(reportId: string, targetType: ModerationTarget): Promise<void> {
    try {
      const table = this.getTableByTarget(targetType);
      const { error } = await this.db()
        .from(table)
        .update({
          status: MODERATION_REPORT_STATUS.REJECTED,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error rejecting report:", error);
      throw new Error(`Erro ao rejeitar denuncia: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async banUser(userId: string, bannedBy: string, reason: string, isPermanent = true): Promise<void> {
    try {
      const { error } = await this.db().from("banned_users").insert({
        user_id: userId,
        banned_by: bannedBy,
        reason,
        is_permanent: isPermanent,
      });

      if (error && !error.message?.includes("duplicate")) {
        throw error;
      }
    } catch (error: unknown) {
      logger.error("Error banning user:", error);
      throw new Error(`Erro ao banir usuario: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async getBannedStatus(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await this.db()
        .from("banned_users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        const errorCode = (error as SupabaseErrorLike).code || "";
        if (!["PGRST116", "42P01", "PGRST301"].includes(errorCode)) {
          logger.error("Error fetching banned status:", error);
        }
        return null;
      }
      return (data as Record<string, unknown>) || null;
    } catch (error: unknown) {
      logger.error("Error in getBannedStatus:", error);
      return null;
    }
  }

  async updateReportStatus(
    targetType: "post" | "comment",
    targetId: string,
    status: string,
    reviewedBy: string,
  ): Promise<void> {
    try {
      const { error } = await this.db()
        .from("community_reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
        })
        .eq("target_type", targetType)
        .eq("target_id", targetId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error updating report status:", error);
      throw new Error(`Erro ao atualizar status: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async removeComment(commentId: string): Promise<void> {
    try {
      const { error } = await this.db()
        .from("community_comments")
        .update({ is_removed: true })
        .eq("id", commentId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error removing comment:", error);
      throw new Error(`Erro ao remover comentario: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async getCommentAuthorId(commentId: string): Promise<string | null> {
    try {
      const { data, error } = await this.db()
        .from("community_comments")
        .select("author_profile_id")
        .eq("id", commentId)
        .single();

      if (error) throw error;
      return (data as { author_profile_id?: string } | null)?.author_profile_id || null;
    } catch (error: unknown) {
      logger.error("Error fetching comment author:", error);
      return null;
    }
  }

  async warnUser(
    userId: string,
    warnedBy: string,
    reason: string,
    severity: "low" | "medium" | "high" = "medium",
  ): Promise<void> {
    try {
      const { error } = await this.db().from("user_warnings").insert({
        user_id: userId,
        warned_by: warnedBy,
        reason,
        severity,
      });

      if (error) throw error;
    } catch (error: unknown) {
      logger.error("Error warning user:", error);
      throw new Error(`Erro ao avisar usuario: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }
}

export const ModerationService = new ModerationServiceClass();
export default ModerationService;
