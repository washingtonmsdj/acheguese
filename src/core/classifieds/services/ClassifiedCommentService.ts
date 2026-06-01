import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TRUST_EVENT_TYPES,
  TRUST_VISIBILITIES,
  TrustEventService,
} from "@/core/trust";

export interface ClassifiedComment {
  id: string;
  classified_id: string;
  author_profile_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

class ClassifiedCommentService {
  private async hasOpenReportForActor(input: {
    classifiedId: string;
    commentId: string;
    reporterProfileId: string;
  }): Promise<boolean> {
    const { data, error } = await supabase
      .from("trust_events")
      .select("id")
      .eq("context_type", TRUST_CONTEXT_TYPES.CLASSIFIED)
      .eq("context_id", input.classifiedId)
      .eq("actor_profile_id", input.reporterProfileId)
      .eq("event_type", TRUST_EVENT_TYPES.INCIDENT)
      .in("status", ["active", "under_review"])
      .contains("evidence", { comment_id: input.commentId })
      .limit(1);

    if (error) {
      logger.error("[ClassifiedCommentService] hasOpenReportForActor failed", error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  }

  async listByClassifiedId(classifiedId: string): Promise<ClassifiedComment[]> {
    const { data, error } = await supabase
      .from("classified_comments")
      .select(`
        id,
        classified_id,
        author_profile_id,
        content,
        created_at,
        updated_at,
        deleted_at,
        author:profiles!classified_comments_author_profile_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq("classified_id", classifiedId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("[ClassifiedCommentService] listByClassifiedId failed", error);
      throw error;
    }

    return (data ?? []) as ClassifiedComment[];
  }

  async create(input: {
    classifiedId: string;
    authorProfileId: string;
    content: string;
  }): Promise<ClassifiedComment> {
    const content = input.content.trim();

    const { data, error } = await supabase
      .from("classified_comments")
      .insert({
        classified_id: input.classifiedId,
        author_profile_id: input.authorProfileId,
        content,
      })
      .select(`
        id,
        classified_id,
        author_profile_id,
        content,
        created_at,
        updated_at,
        deleted_at,
        author:profiles!classified_comments_author_profile_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      logger.error("[ClassifiedCommentService] create failed", error);
      throw error;
    }

    return data as ClassifiedComment;
  }

  async remove(commentId: string, authorProfileId: string): Promise<void> {
    const { error } = await supabase
      .from("classified_comments")
      .delete()
      .eq("id", commentId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      logger.error("[ClassifiedCommentService] remove failed", error);
      throw error;
    }
  }

  async reportComment(input: {
    classifiedId: string;
    commentId: string;
    commentAuthorProfileId: string;
    commentAuthorRole: "customer" | "merchant";
    reporterProfileId: string;
    reporterRole: "customer" | "merchant";
    reasonCode?: string;
    description?: string;
    evidence?: Record<string, unknown>;
  }): Promise<{ created: boolean }> {
    const alreadyReported = await this.hasOpenReportForActor({
      classifiedId: input.classifiedId,
      commentId: input.commentId,
      reporterProfileId: input.reporterProfileId,
    });

    if (alreadyReported) {
      return { created: false };
    }

    const result = await TrustEventService.createEvent({
      actor_profile_id: input.reporterProfileId,
      actor_role:
        input.reporterRole === "merchant"
          ? TRUST_ACTOR_ROLES.MERCHANT
          : TRUST_ACTOR_ROLES.CUSTOMER,
      subject_profile_id: input.commentAuthorProfileId,
      subject_role:
        input.commentAuthorRole === "merchant"
          ? TRUST_ACTOR_ROLES.MERCHANT
          : TRUST_ACTOR_ROLES.CUSTOMER,
      context_type: TRUST_CONTEXT_TYPES.CLASSIFIED,
      context_id: input.classifiedId,
      event_type: TRUST_EVENT_TYPES.INCIDENT,
      reason_code: input.reasonCode ?? "classified_comment_report",
      severity: "medium",
      visibility: TRUST_VISIBILITIES.PRIVATE,
      description:
        input.description ??
        "Comentário/pergunta de classificado denunciado para revisão administrativa.",
      evidence: {
        comment_id: input.commentId,
        ...(input.evidence ?? {}),
      },
    });

    if (result.error) {
      logger.error("[ClassifiedCommentService] reportComment failed", result.error);
      throw new Error(result.error);
    }

    return { created: true };
  }
}

export const classifiedCommentService = new ClassifiedCommentService();
