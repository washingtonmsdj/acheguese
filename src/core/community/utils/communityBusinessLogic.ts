/**
 * Logica de negocio especifica da comunidade.
 *
 * Funcoes que dependem de services e tipos de dominio.
 */

import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
import { CommunityNotificationBrokerService } from "@/core/notifications/services";
import { postService } from "@/core/posts/services";
import { logger } from "@/shared/utils/logger";

/**
 * Verificar se perfil pode criar post (rate limit + permissoes).
 *
 * - Maximo 5 posts por dia por perfil.
 * - Verificacao de permissoes via AuthorizationEngine.
 */
export async function checkPostRateLimit(
  profileId: string,
  _supabaseClient?: unknown,
): Promise<{
  canPost: boolean;
  postsToday: number;
  limit: number;
  reason?: string;
}> {
  const hasPermission = await AuthorizationEngine.canProfilePerformAction(
    profileId,
    "createPost",
    {},
  );
  if (!hasPermission) {
    return {
      canPost: false,
      postsToday: 0,
      limit: 5,
      reason: "Sem permissao para postar",
    };
  }

  try {
    const postsToday = await postService.getPostsCountByAuthorToday(profileId);
    const limit = 5;

    return {
      canPost: postsToday < limit,
      postsToday,
      limit,
    };
  } catch (error) {
    logger.error(
      "Error checking post rate limit via PostService",
      error as Error,
      { profileId },
    );
    return { canPost: true, postsToday: 0, limit: 5 };
  }
}

/**
 * Verificar se perfil pode comentar (rate limit + permissoes).
 *
 * - Maximo 10 comentarios por hora.
 * - Verificacao de permissoes via AuthorizationEngine.
 */
export async function checkCommentRateLimit(
  profileId: string,
  _supabaseClient?: unknown,
): Promise<{
  canComment: boolean;
  commentsThisHour: number;
  limit: number;
  reason?: string;
}> {
  const hasPermission = await AuthorizationEngine.canProfilePerformAction(
    profileId,
    "createComment",
    {},
  );
  if (!hasPermission) {
    return {
      canComment: false,
      commentsThisHour: 0,
      limit: 10,
      reason: "Sem permissao para comentar",
    };
  }

  return {
    canComment: true,
    commentsThisHour: 0,
    limit: 10,
  };
}

/**
 * Criar notificacao quando alguem comenta em um post.
 *
 * O broker server-side exige o commentId real para validar o evento no banco.
 */
export async function createCommentNotification(
  postId: string,
  actorId: string,
  _commentContent: string,
  _supabaseClient?: unknown,
  commentId?: string,
): Promise<void> {
  try {
    if (!commentId) {
      logger.warn("Skipped comment notification without validated commentId", {
        postId,
        actorId,
      });
      return;
    }

    await CommunityNotificationBrokerService.notifyPostComment(postId, commentId, actorId);
  } catch (error) {
    logger.error("Error in createCommentNotification", error as Error, {
      postId,
      actorId,
    });
  }
}

/**
 * Criar notificacao quando alguem responde um comentario.
 *
 * O broker server-side exige o replyCommentId real para validar o evento.
 */
export async function createReplyNotification(
  postId: string,
  parentCommentId: string,
  actorId: string,
  _replyContent: string,
  _supabaseClient?: unknown,
  replyCommentId?: string,
): Promise<void> {
  try {
    if (!replyCommentId) {
      logger.warn("Skipped reply notification without validated replyCommentId", {
        parentCommentId,
        postId,
        actorId,
      });
      return;
    }

    await CommunityNotificationBrokerService.notifyCommentReply(
      postId,
      parentCommentId,
      replyCommentId,
      actorId,
    );
  } catch (error) {
    logger.error("Error in createReplyNotification", error as Error, {
      postId,
      parentCommentId,
      actorId,
    });
  }
}

/**
 * Criar notificacao quando alguem curte um post.
 */
export async function createLikeNotification(
  postId: string,
  actorId: string,
  _supabaseClient?: unknown,
): Promise<void> {
  try {
    await CommunityNotificationBrokerService.notifyPostLike(postId, actorId);
  } catch (error) {
    logger.error("Error in createLikeNotification", error as Error, {
      postId,
      actorId,
    });
  }
}

/**
 * Criar notificacoes para seguidores de um post quando ha novo comentario.
 *
 * O SSOT remoto atual nao possui `followed_posts`; manter envio server-side
 * fechado ate resolver o modelo canonico de follow de posts.
 */
export async function createFollowedPostNotifications(
  postId: string,
  actorId: string,
  commentContent: string,
  _supabaseClient?: unknown,
): Promise<void> {
  logger.warn("Skipped followed-post notifications until followed post SSOT is resolved", {
    postId,
    actorId,
    preview: commentContent.substring(0, 100),
  });
}

/**
 * Detectar mencoes (@username) no conteudo e criar notificacoes.
 *
 * O broker valida que o post pertence ao perfil ator e extrai as mencoes do
 * conteudo persistido no banco, nao do texto enviado pelo browser.
 */
export async function createMentionNotifications(
  content: string,
  postId: string,
  actorId: string,
): Promise<void> {
  try {
    if (!/@[a-zA-Z0-9_]{3,30}/.test(content)) {
      return;
    }

    await CommunityNotificationBrokerService.notifyPostMentions(postId, actorId);
  } catch (error) {
    logger.error("Error in createMentionNotifications", error as Error, {
      postId,
      actorId,
    });
  }
}
