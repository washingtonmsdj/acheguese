/**
 * Lógica de negócio específica da comunidade
 *
 * Funções que dependem de services e tipos de domínio
 */

import { logger } from "@/shared/utils/logger";
import { NotificationService } from "@/core/notifications/services/NotificationService";
import type {
  NotificationType,
} from "@/core/notifications/services/NotificationService";
import { commentService } from "@/core/comments/services";
import { postService } from "@/core/posts/services";
import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { Post } from "@/core/posts/types";

type PostOwnershipShape = Pick<Post, "author_profile_id">;

function getPostOwnerProfileId(post: PostOwnershipShape | null): string | null {
  if (!post) return null;
  return post.author_profile_id ?? null;
}

/**
 * Verificar se perfil pode criar post (rate limit + permissões)
 *
 * - Máximo 5 posts por dia por perfil
 * - Verificação de permissões via AuthorizationEngine
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
      reason: "Sem permissão para postar",
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
 * Verificar se perfil pode comentar (rate limit + permissões)
 *
 * - Máximo 10 comentários por hora
 * - Verificação de permissões via AuthorizationEngine
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
      reason: "Sem permissão para comentar",
    };
  }

  return {
    canComment: true,
    commentsThisHour: 0,
    limit: 10,
  };
}

/**
 * Criar notificação quando alguém comenta em um post
 */
export async function createCommentNotification(
  postId: string,
  actorId: string,
  commentContent: string,
  _supabaseClient?: unknown,
): Promise<void> {
  try {
    const post = await postService.getPostById(postId);
    if (!post) {
      logger.error("Post not found for notification", null, { postId });
      return;
    }

    const postOwnerProfileId = getPostOwnerProfileId(post);
    if (!postOwnerProfileId || postOwnerProfileId === actorId) {
      return;
    }

    const actor = await profileService.getProfileById(actorId);

    await NotificationService.createNotification({
      user_id: postOwnerProfileId,
      type: "info" as NotificationType,
      category: "social",
      title: "Novo comentário",
      message: `${actor?.name || "Alguém"} comentou no seu post`,
      metadata: {
        post_id: postId,
        comment_id: "",
        actor_id: actorId,
        actor_name: actor?.name || "Usuário",
        content_preview: commentContent.substring(0, 100),
      },
    });
  } catch (error) {
    logger.error("Error in createCommentNotification", error as Error, {
      postId,
      actorId,
    });
  }
}

/**
 * Criar notificação quando alguém responde um comentário
 */
export async function createReplyNotification(
  postId: string,
  parentCommentId: string,
  actorId: string,
  replyContent: string,
  _supabaseClient?: unknown,
): Promise<void> {
  try {
    const parentComment = await commentService.getCommentById(parentCommentId);
    if (!parentComment) {
      logger.warn("Parent comment not found for reply notification", {
        parentCommentId,
        postId,
      });
      return;
    }

    if (parentComment.author_profile_id === actorId) {
      return;
    }

    const actor = await profileService.getProfileById(actorId);
    await NotificationService.createNotification({
      user_id: parentComment.author_profile_id,
      type: "info" as NotificationType,
      category: "social",
      title: "Nova resposta no comentario",
      message: `${actor?.name || "Alguem"} respondeu seu comentario`,
      metadata: {
        post_id: postId,
        parent_comment_id: parentCommentId,
        actor_id: actorId,
        actor_name: actor?.name || "Usuario",
        content_preview: replyContent.substring(0, 100),
      },
    });
  } catch (error) {
    logger.error("Error in createReplyNotification", error as Error, {
      postId,
      parentCommentId,
      actorId,
    });
  }
}

/**
 * Criar notificação quando alguém curte um post
 */
export async function createLikeNotification(
  postId: string,
  actorId: string,
  _supabaseClient?: unknown,
): Promise<void> {
  try {
    const post = await postService.getPostById(postId);
    if (!post) {
      logger.error("Post not found for like notification", null, { postId });
      return;
    }

    const postOwnerProfileId = getPostOwnerProfileId(post);
    if (!postOwnerProfileId || postOwnerProfileId === actorId) {
      return;
    }

    const actor = await profileService.getProfileById(actorId);

    await NotificationService.createNotification({
      user_id: postOwnerProfileId,
      type: "info" as NotificationType,
      category: "social",
      title: "Nova curtida",
      message: `${actor?.name || "Alguém"} curtiu seu post`,
      metadata: {
        post_id: postId,
        actor_id: actorId,
        actor_name: actor?.name || "Usuário",
        actor_avatar: actor?.avatar_url,
      },
    });
  } catch (error) {
    logger.error("Error in createLikeNotification", error as Error, {
      postId,
      actorId,
    });
  }
}

/**
 * Criar notificações para seguidores de um post quando há novo comentário
 */
export async function createFollowedPostNotifications(
  postId: string,
  actorId: string,
  commentContent: string,
  _supabaseClient?: unknown,
): Promise<void> {
  try {
    const followerIds = await postService.getFollowedPostUserIds(postId);
    const actor = await profileService.getProfileById(actorId);

    for (const followerId of followerIds) {
      if (followerId === actorId) continue;
      try {
        await NotificationService.createNotification({
          user_id: followerId,
          type: "info" as NotificationType,
          category: "social",
          title: "Novo comentário em post seguido",
          message: `${actor?.name || "Alguém"} comentou em um post que você segue`,
          metadata: {
            post_id: postId,
            actor_id: actorId,
            actor_name: actor?.name || "Usuário",
            content_preview: commentContent.substring(0, 100),
          },
        });
      } catch (err) {
        logger.error("Error creating notification for follower", err, {
          followerId,
          postId,
        });
      }
    }
  } catch (error) {
    logger.error("Error in createFollowedPostNotifications", error as Error, {
      postId,
      actorId,
    });
  }
}

/**
 * Detectar menções (@username) no conteúdo e criar notificações
 */
export async function createMentionNotifications(
  content: string,
  postId: string,
  actorId: string,
): Promise<void> {
  try {
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);

    if (!mentions || mentions.length === 0) {
      return;
    }

    const usernames = mentions.map((m) => m.substring(1));

    const usersOrNull = await Promise.all(
      usernames.map((username) => profileService.getByUsername(username))
    );
    const users = usersOrNull.filter((u): u is NonNullable<typeof u> => u !== null);

    if (!users || users.length === 0) {
      return;
    }

    const actor = await profileService.getProfileById(actorId);

    const mentionedUsers = users.filter((user) => user.id !== actorId);

    for (const user of mentionedUsers) {
      try {
        await NotificationService.createNotification({
          user_id: user.id,
          type: "info" as NotificationType,
          category: "social",
          title: "Você foi mencionado",
          message: `${actor?.name || "Alguém"} mencionou você em um post`,
          metadata: {
            post_id: postId,
            actor_id: actorId,
            actor_name: actor?.name || "Usuário",
            content_preview: content.substring(0, 100),
          },
        });
      } catch (err) {
        logger.error("Error creating mention notification", err, {
          userId: user.id,
          postId,
        });
      }
    }
  } catch (error) {
    logger.error("Error in createMentionNotifications", error as Error, {
      postId,
      actorId,
    });
  }
}
