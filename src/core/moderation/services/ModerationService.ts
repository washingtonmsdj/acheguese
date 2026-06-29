/**
 * MODERATION SERVICE - SSOT para Sistema de Moderacao
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { MODERATION_REPORT_STATUS } from "@/core/moderation/constants/reportStatus";
import { CommentService } from "@/core/comments/services/CommentService";
import { postService } from "@/core/posts/services/PostService";
import { profileService } from "@/core/profiles/services/ProfileService";

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

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type ModerationDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const moderationDb = supabase as unknown as ModerationDbClient;

class ModerationServiceClass {
  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === "object" && error !== null) {
      return (error as SupabaseErrorLike).message || fallback;
    }
    return fallback;
  }

  private async resolveProfileId(identifier: string): Promise<string | null> {
    return profileService.resolveProfileId(identifier);
  }

  private async resolveTargetAuthorProfileId(
    targetType: ModerationTarget,
    targetId: string,
  ): Promise<string> {
    if (targetType === "profile") return targetId;

    const authorProfileId =
      targetType === "post"
        ? await postService.getPostAuthorId(targetId)
        : (await CommentService.getCommentById(targetId))?.author_profile_id;

    if (!authorProfileId) throw new Error("Conteudo denunciado nao encontrado");
    return authorProfileId;
  }

  async reportContent(input: ReportContentInput): Promise<void> {
    try {
      const targetAuthorProfileId = await this.resolveTargetAuthorProfileId(
        input.targetType,
        input.targetId,
      );

      const { error } = await moderationDb.from("community_reports").insert({
        target_type: input.targetType,
        target_id: input.targetId,
        target_author_profile_id: targetAuthorProfileId,
        reporter_profile_id: input.reporterId,
        reason: input.reason,
        description: input.details || null,
      });

      if (error) {
        if ((error as SupabaseErrorLike).code === "23505") {
          throw new Error("Voce ja enviou uma denuncia para este conteudo.");
        }
        throw error;
      }
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
        const { data, error } = await moderationDb
          .from("community_reports")
          .select("*")
          .eq("target_type", targetType)
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
      const { error } = await moderationDb
        .from("community_reports")
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
      const { error } = await moderationDb
        .from("community_reports")
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
      const { error } = await moderationDb.from("banned_users").insert({
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
      const { data, error } = await moderationDb
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
      const reviewerProfileId = await this.resolveProfileId(reviewedBy);

      const { error } = await moderationDb
        .from("community_reports")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerProfileId,
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
      await CommentService.removeCommentForModeration(commentId);
    } catch (error: unknown) {
      logger.error("Error removing comment:", error);
      throw new Error(`Erro ao remover comentario: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async moderatePost(
    postId: string,
    moderatedBy: string,
    action: "approve" | "reject" | "flag" | "delete",
    reason?: string,
  ): Promise<void> {
    try {
      if (action === "delete") {
        await postService.removePost(
          postId,
          reason || "Moderacao",
          (await this.resolveProfileId(moderatedBy)) || moderatedBy,
        );
        return;
      }

      const moderatorProfileId = await this.resolveProfileId(moderatedBy);
      const updateData =
        action === "approve"
          ? {
              is_hidden: false,
              is_removed: false,
              is_published: true,
              removed_reason: null,
              removed_at: null,
              removed_by: null,
            }
          : {
              is_hidden: true,
              is_published: false,
              removed_reason: reason || null,
              removed_by: moderatorProfileId,
            };

      await postService.updatePostModerationState(postId, updateData);
    } catch (error: unknown) {
      logger.error("Error moderating post:", error);
      throw new Error(`Erro ao moderar postagem: ${this.getErrorMessage(error, "erro desconhecido")}`);
    }
  }

  async getCommentAuthorId(commentId: string): Promise<string | null> {
    try {
      return (await CommentService.getCommentById(commentId))?.author_profile_id || null;
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
      const { error } = await moderationDb.from("user_warnings").insert({
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
