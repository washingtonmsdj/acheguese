// @ts-nocheck
/**
 * SocialInteractionsService - GATE 3 FASE 3C
 *
 * Service centralizado para interações sociais usando profile_id consistentemente
 * Responsável por:
 * - Likes de posts (post_likes_new)
 * - Posts salvos (saved_posts_new)
 * - Membros de grupos (group_members_new)
 * - Mensagens de grupos (group_messages_new)
 *
 * REGRAS:
 * - Usa profile ativo como identidade de interação
 * - Elimina uso de user_id como identidade de atuação
 * - Fonte única de verdade para interações sociais
 */

import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  PostLike,
  SavedPost,
  GroupMember,
  GroupMessage,
  CreateGroupMessageData,
  SocialInteractionStats,
} from "../../../services/social/types";

export class SocialInteractionsService {
  // ============================================================================
  // POST LIKES - Curtidas de Posts
  // ============================================================================

  /**
   * Curtir um post usando profile ativo
   */
  static async likePost(
    postId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any).from("post_likes_new").insert({
        post_id: postId,
        liker_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (já curtiu)
        if (error.code === "23505") {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "likePost",
        metadata: { postId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Descurtir um post usando profile ativo
   */
  static async unlikePost(
    postId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any)
        .from("post_likes_new")
        .delete()
        .eq("post_id", postId)
        .eq("liker_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "unlikePost",
        metadata: { postId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verificar se profile curtiu um post
   */
  static async hasLikedPost(postId: string, userId?: string): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("post_likes_new")
        .select("id")
        .eq("post_id", postId)
        .eq("liker_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "hasLikedPost",
        metadata: { postId, userId },
      });
      return false;
    }
  }

  /**
   * Buscar likes de múltiplos posts para um profile
   */
  static async getLikesForPosts(
    postIds: string[],
    userId?: string,
  ): Promise<Set<string>> {
    try {
      if (postIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("post_likes_new")
        .select("post_id")
        .eq("liker_profile_id", activeProfile.id)
        .in("post_id", postIds);

      if (error) throw error;

      return new Set(data?.map((like) => like.post_id) || []);
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getLikesForPosts",
        metadata: { postIds: postIds.length, userId },
      });
      return new Set();
    }
  }

  // ============================================================================
  // SAVED POSTS - Posts Salvos
  // ============================================================================

  /**
   * Salvar um post usando profile ativo
   */
  static async savePost(
    postId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any).from("saved_posts_new").insert({
        post_id: postId,
        saver_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (já salvou)
        if (error.code === "23505") {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "savePost",
        metadata: { postId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Remover post dos salvos usando profile ativo
   */
  static async unsavePost(
    postId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any)
        .from("saved_posts_new")
        .delete()
        .eq("post_id", postId)
        .eq("saver_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "unsavePost",
        metadata: { postId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verificar se profile salvou um post
   */
  static async hasSavedPost(postId: string, userId?: string): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("saved_posts_new")
        .select("id")
        .eq("post_id", postId)
        .eq("saver_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "hasSavedPost",
        metadata: { postId, userId },
      });
      return false;
    }
  }

  /**
   * Buscar posts salvos de múltiplos posts para um profile
   */
  static async getSavedForPosts(
    postIds: string[],
    userId?: string,
  ): Promise<Set<string>> {
    try {
      if (postIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("saved_posts_new")
        .select("post_id")
        .eq("saver_profile_id", activeProfile.id)
        .in("post_id", postIds);

      if (error) throw error;

      return new Set(data?.map((saved) => saved.post_id) || []);
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getSavedForPosts",
        metadata: { postIds: postIds.length, userId },
      });
      return new Set();
    }
  }

  /**
   * Buscar posts salvos por um profile (paginado)
   */
  static async getSavedPosts(
    userId?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<SavedPost[]> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("saved_posts_new")
        .select("*")
        .eq("saver_profile_id", activeProfile.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getSavedPosts",
        metadata: { userId, limit, offset },
      });
      return [];
    }
  }

  // ============================================================================
  // GROUP MEMBERS - Membros de Grupos
  // ============================================================================

  /**
   * Entrar em um grupo usando profile ativo
   */
  static async joinGroup(
    groupId: string,
    userId?: string,
    role: string = "member",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any)
        .from("group_members_new")
        .insert({
          group_id: groupId,
          member_profile_id: activeProfile.id,
          role,
        });

      if (error) {
        // Ignorar erro de duplicata (já é membro)
        if (error.code === "23505") {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "joinGroup",
        metadata: { groupId, userId, role },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Sair de um grupo usando profile ativo
   */
  static async leaveGroup(
    groupId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any)
        .from("group_members_new")
        .delete()
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "leaveGroup",
        metadata: { groupId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Verificar se profile é membro de um grupo
   */
  static async isMemberOfGroup(
    groupId: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("group_members_new")
        .select("id")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "isMemberOfGroup",
        metadata: { groupId, userId },
      });
      return false;
    }
  }

  /**
   * Buscar membros de um grupo
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("group_members_new")
        .select(
          `
          *,
          profile:member_profile_id(id, name, avatar_url)
        `,
        )
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getGroupMembers",
        metadata: { groupId },
      });
      return [];
    }
  }

  // ============================================================================
  // GROUP MESSAGES - Mensagens de Grupos
  // ============================================================================

  /**
   * Enviar mensagem em um grupo usando profile ativo
   */
  static async sendGroupMessage(
    data: CreateGroupMessageData,
    userId?: string,
  ): Promise<{ success: boolean; message?: GroupMessage; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data: message, error } = await (supabase as any)
        .from("group_messages_new")
        .insert({
          group_id: data.groupId,
          sender_profile_id: activeProfile.id,
          content: data.content,
        })
        .select(
          `
          *,
          profile:sender_profile_id(id, name, avatar_url)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, message };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "sendGroupMessage",
        metadata: { groupId: data.groupId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Buscar mensagens de um grupo
   */
  static async getGroupMessages(
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GroupMessage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("group_messages_new")
        .select(
          `
          *,
          profile:sender_profile_id(id, name, avatar_url)
        `,
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getGroupMessages",
        metadata: { groupId, limit, offset },
      });
      return [];
    }
  }

  /**
   * Deletar mensagem de grupo (apenas o autor pode deletar)
   */
  static async deleteGroupMessage(
    messageId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { error } = await (supabase as any)
        .from("group_messages_new")
        .delete()
        .eq("id", messageId)
        .eq("sender_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "deleteGroupMessage",
        metadata: { messageId, userId },
      });
      return { success: false, error: err.message };
    }
  }

  // ============================================================================
  // STATISTICS - Estatísticas
  // ============================================================================

  /**
   * Buscar estatísticas de interações sociais para um profile
   * @param profileId - ID do perfil (profiles.id), não user_id
   */
  static async getInteractionStats(
    profileId?: string,
  ): Promise<SocialInteractionStats> {
    try {
      // Se profileId não fornecido, resolver via usuário autenticado
      let targetProfileId = profileId;
      if (!targetProfileId) {
        const activeProfile = await profileService.getRequiredActiveProfile();
        targetProfileId = activeProfile.id;
      }

      const [likesResult, savedResult, groupsResult] = await Promise.all([
        supabase
          .from("post_likes_new")
          .select("id", { count: "exact", head: true })
          .eq("liker_profile_id", targetProfileId),

        supabase
          .from("saved_posts_new")
          .select("id", { count: "exact", head: true })
          .eq("saver_profile_id", targetProfileId),

        supabase
          .from("group_members_new")
          .select("id", { count: "exact", head: true })
          .eq("member_profile_id", targetProfileId),
      ]);

      return {
        likesGiven: likesResult.count || 0,
        postsSaved: savedResult.count || 0,
        groupsJoined: groupsResult.count || 0,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getInteractionStats",
        metadata: { profileId },
      });
      return {
        likesGiven: 0,
        postsSaved: 0,
        groupsJoined: 0,
      };
    }
  }
  /**
   * Like a comment
   * ✅ LOTE 7 - Delegado ao CommentService
   */
  static async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { CommentService } =
      await import("@/core/comments/services/CommentService");
    return CommentService.likeComment(commentId, userId);
  }

  /**
   * Unlike a comment
   * ✅ LOTE 7 - Delegado ao CommentService
   */
  static async unlikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const { CommentService } =
      await import("@/core/comments/services/CommentService");
    return CommentService.unlikeComment(commentId, userId);
  }

  /**
   * Verifica se está seguindo um usuário
   */
  static async isFollowingUser(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    try {
      const { data } = await (supabase as any)
        .from("user_follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Alterna follow/unfollow de um usuário
   */
  static async toggleFollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ action: "follow" | "unfollow"; error?: string }> {
    try {
      const { data: existing } = await (supabase as any)
        .from("user_follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("user_follows")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "unfollow" };
      } else {
        const { error } = await (supabase as any)
          .from("user_follows")
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
        return { action: "follow" };
      }
    } catch (error: any) {
      return { action: "follow", error: error.message };
    }
  }

  /**
   * Busca IDs dos usuários seguidos por um usuário
   */
  static async getFollowedUserIds(userId: string): Promise<string[]> {
    try {
      const { data } = await (supabase as any)
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", userId);
      return (data || []).map((f) => f.following_id);
    } catch {
      return [];
    }
  }

  /**
   * Busca IDs dos grupos em que o usuário é membro
   */
  static async getUserGroupIds(userId?: string): Promise<string[]> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await (supabase as any)
        .from("group_members_new")
        .select("group_id")
        .eq("member_profile_id", activeProfile.id);

      if (error) throw error;

      return (data || []).map((m) => m.group_id);
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getUserGroupIds",
        metadata: { userId },
      });
      return [];
    }
  }

  /**
   * Busca mensagem de grupo por ID
   */
  static async getGroupMessageById(messageId: string): Promise<any | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("group_messages_new")
        .select("*, profile:sender_profile_id(id, name, avatar_url)")
        .eq("id", messageId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        profile:
          Array.isArray(data.profile) && data.profile.length > 0
            ? data.profile[0]
            : data.profile,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getGroupMessageById",
        metadata: { messageId },
      });
      return null;
    }
  }
}

export const socialInteractionsService = new SocialInteractionsService();

// ============================================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================================

/**
 * 👥 SocialInteractionsFacade - Interface SSOT unificada v2.0
 *
 * Uso: SocialInteractionsFacade.likePost(postId, userId)
 *      SocialInteractionsFacade.savePost(postId, userId)
 *      SocialInteractionsFacade.joinGroup(groupId, userId)
 *
 * @deprecated Use SocialInteractionsService diretamente (já é estático)
 */
export const SocialInteractionsFacade = {
  // Post Likes
  likePost: SocialInteractionsService.likePost,
  unlikePost: SocialInteractionsService.unlikePost,
  hasLikedPost: SocialInteractionsService.hasLikedPost,
  getLikesForPosts: SocialInteractionsService.getLikesForPosts,

  // Saved Posts
  savePost: SocialInteractionsService.savePost,
  unsavePost: SocialInteractionsService.unsavePost,
  hasSavedPost: SocialInteractionsService.hasSavedPost,
  getSavedPosts: SocialInteractionsService.getSavedPosts,

  // Group Members
  joinGroup: SocialInteractionsService.joinGroup,
  leaveGroup: SocialInteractionsService.leaveGroup,
  getGroupMembers: SocialInteractionsService.getGroupMembers,
  getUserGroupIds: SocialInteractionsService.getUserGroupIds,

  // Group Messages
  sendGroupMessage: SocialInteractionsService.sendGroupMessage,
  getGroupMessages: SocialInteractionsService.getGroupMessages,
  deleteGroupMessage: SocialInteractionsService.deleteGroupMessage,
  getGroupMessageById: SocialInteractionsService.getGroupMessageById,

  // Comment Likes
  likeComment: SocialInteractionsService.likeComment,
  unlikeComment: SocialInteractionsService.unlikeComment,

  // Follows
  getFollowedUserIds: SocialInteractionsService.getFollowedUserIds,

  // Stats
  getInteractionStats: SocialInteractionsService.getInteractionStats,
} as const;
