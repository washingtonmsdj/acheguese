import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  TrustIncidentService,
  type ClassifiedCommentIncidentReason,
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
    reason: ClassifiedCommentIncidentReason;
    description?: string;
  }): Promise<{ created: boolean }> {
    const result = await TrustIncidentService.reportClassifiedComment(input);
    return { created: result.created };
  }
}

export const classifiedCommentService = new ClassifiedCommentService();
