/**
 * Comment mutations — SSOT canônico
 *
 * Responsabilidade: Operações de escrita (criar, atualizar, deletar)
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { Comment, CreateCommentData, UpdateCommentData } from "../types";

const TABLE = "comments";
const LIKES_TABLE = "comment_likes";

interface QueryError {
  message?: string | null;
  code?: string | null;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
}

interface CommentsDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const commentsDb = supabase as unknown as CommentsDbClient;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

export class CommentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "CommentError";
  }
}

/**
 * Cria um novo comentário
 */
export async function createComment(
  commentData: CreateCommentData & {
    post_id: string;
    author_profile_id: string;
  },
): Promise<Comment | null> {
  try {
    // ✅ FUNDAÇÃO 3: Validar dados de entrada
    const { CreateCommentSchema } =
      await import("@/shared/validation/schemas/comment.schema");
    const validatedData = CreateCommentSchema.parse({
      post_id: commentData.post_id,
      content: commentData.content,
      parent_comment_id: commentData.parent_id,
    });

    const { data, error } = await commentsDb
      .from(TABLE)
      .insert([
        {
          post_id: validatedData.post_id,
          content: validatedData.content,
          parent_id: validatedData.parent_comment_id,
          author_profile_id: commentData.author_profile_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    // ✅ FUNDAÇÃO 3: Tratar erros de validação
    const { handleValidationError } = await import("@/shared/validation");
    const validationMessage = handleValidationError(error);
    if (validationMessage !== "Erro de validação desconhecido") {
      throw new CommentError(validationMessage, "VALIDATION_ERROR", 400);
    }

    trackError(error as Error, {
      component: "comments.mutations",
      action: "createComment",
      metadata: { postId: commentData.post_id },
    });
    return null;
  }
}

/**
 * Atualiza um comentário
 */
export async function updateComment(
  commentId: string,
  updates: UpdateCommentData,
): Promise<Comment | null> {
  try {
    // ✅ FUNDAÇÃO 3: Validar dados de entrada
    const { UpdateCommentSchema } =
      await import("@/shared/validation/schemas/comment.schema");
    const validatedData = UpdateCommentSchema.parse({
      content: updates.content,
    });

    const { data, error } = await commentsDb
      .from(TABLE)
      .update({ content: validatedData.content })
      .eq("id", commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    // ✅ FUNDAÇÃO 3: Tratar erros de validação
    const { handleValidationError } = await import("@/shared/validation");
    const validationMessage = handleValidationError(error);
    if (validationMessage !== "Erro de validação desconhecido") {
      throw new CommentError(validationMessage, "VALIDATION_ERROR", 400);
    }

    trackError(error as Error, {
      component: "comments.mutations",
      action: "updateComment",
      metadata: { commentId },
    });
    return null;
  }
}

/**
 * Deleta um comentário
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await commentsDb
      .from(TABLE)
      .delete()
      .eq("id", commentId);

    if (error) throw error;
    return true;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.mutations",
      action: "deleteComment",
      metadata: { commentId },
    });
    return false;
  }
}

/**
 * Curte um comentário
 * ✅ LOTE 7 - Boundary canônico para comment_likes
 */
/**
 * Remove um comentario por moderacao sem apagar o registro.
 */
export async function removeCommentForModeration(
  commentId: string,
  reason = "Moderacao",
  moderatorProfileId?: string | null,
): Promise<void> {
  try {
    const { error } = await commentsDb
      .from(TABLE)
      .update({
        is_removed: true,
        is_hidden: true,
        content: "[comentario removido pela moderacao]",
        removed_reason: reason,
        removed_by: moderatorProfileId ?? null,
        removed_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) throw error;
  } catch (error) {
    trackError(error as Error, {
      component: "comments.mutations",
      action: "removeCommentForModeration",
      metadata: { commentId, moderatorProfileId },
    });
    throw new CommentError("Erro ao remover comentario", "MODERATION_REMOVE_ERROR");
  }
}

export async function likeComment(
  commentId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await commentsDb
      .from(LIKES_TABLE)
      .insert({ comment_id: commentId, user_id: userId });

    if (error) {
      // Ignorar duplicata (já curtiu)
      if (error.code === "23505") return { success: true };
      throw error;
    }
    return { success: true };
  } catch (error: unknown) {
    trackError(error as Error, {
      component: "comments.mutations",
      action: "likeComment",
      metadata: { commentId, userId },
    });
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Remove curtida de um comentário
 * ✅ LOTE 7 - Boundary canônico para comment_likes
 */
export async function unlikeComment(
  commentId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await commentsDb
      .from(LIKES_TABLE)
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    trackError(error as Error, {
      component: "comments.mutations",
      action: "unlikeComment",
      metadata: { commentId, userId },
    });
    return { success: false, error: getErrorMessage(error) };
  }
}
