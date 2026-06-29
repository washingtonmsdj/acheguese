/**
 * SocialInteractionsService - GATE 3 FASE 3C
 *
 * Service centralizado para interacoes sociais usando profile_id consistentemente
 * Responsavel por:
 * - Likes de posts (post_likes_new)
 * - Posts salvos (saved_posts_new)
 * - Membros de grupos (group_members_new)
 * - Mensagens de grupos (group_messages_new)
 *
 * REGRAS:
 * - Usa profile ativo como identidade de interacao
 * - Elimina uso de user_id como identidade de atuacao
 * - Fonte unica de verdade para interacoes sociais
 */

import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase/types.generated";
import { profileService } from "@/core/profiles/services/ProfileService";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  SavedPost,
  CreateGroupMessageData,
  SocialInteractionStats,
} from "@/core/social/types";
import { SocialGroupInteractionsService } from "./SocialGroupInteractionsService";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(
    columns?: string,
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ): QueryBuilder<TRow>;
  insert(values: Partial<TRow> | Array<Partial<TRow>>): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  range(from: number, to: number): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null; count?: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((
          value: {
            data: TRow[];
            error: { code?: string; message?: string } | null;
            count?: number | null;
          },
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface SocialDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

type PostLikeRow = Database["public"]["Tables"]["post_likes_new"]["Row"];
type SavedPostRow = Database["public"]["Tables"]["saved_posts_new"]["Row"];
type GroupMemberRow = Database["public"]["Tables"]["group_members_new"]["Row"];
type UserFollowRow = Database["public"]["Tables"]["user_follows"]["Row"];

export class SocialInteractionsService {
  private static readonly db = supabase as unknown as SocialDbClient;
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

      const { error } = await this.db.from<PostLikeRow>("post_likes_new").insert({
        post_id: postId,
        liker_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (ja curtiu)
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

      const { error } = await this.db
        .from<PostLikeRow>("post_likes_new")
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

      const { data, error } = await this.db
        .from<Pick<PostLikeRow, "id">>("post_likes_new")
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
   * Buscar likes de multiplos posts para um profile
   */
  static async getLikesForPosts(
    postIds: string[],
    userId?: string,
  ): Promise<Set<string>> {
    try {
      if (postIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await this.db
        .from<Pick<PostLikeRow, "post_id">>("post_likes_new")
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

      const { error } = await this.db.from<SavedPostRow>("saved_posts_new").insert({
        post_id: postId,
        saver_profile_id: activeProfile.id,
      });

      if (error) {
        // Ignorar erro de duplicata (ja salvou)
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

      const { error } = await this.db
        .from<SavedPostRow>("saved_posts_new")
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

      const { data, error } = await this.db
        .from<Pick<SavedPostRow, "id">>("saved_posts_new")
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
   * Buscar posts salvos de multiplos posts para um profile
   */
  static async getSavedForPosts(
    postIds: string[],
    userId?: string,
  ): Promise<Set<string>> {
    try {
      if (postIds.length === 0) return new Set();

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await this.db
        .from<Pick<SavedPostRow, "post_id">>("saved_posts_new")
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

      const { data, error } = await this.db
        .from<SavedPost>("saved_posts_new")
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
  // GROUP MEMBERS / MESSAGES - Delegated to canonical group interactions service
  // ============================================================================

  static async joinGroup(groupId: string, userId?: string, role: string = "member") {
    return SocialGroupInteractionsService.joinGroup(groupId, userId, role);
  }

  static async leaveGroup(groupId: string, userId?: string) {
    return SocialGroupInteractionsService.leaveGroup(groupId, userId);
  }

  static async updateGroupMemberRole(
    groupId: string,
    memberProfileId: string,
    role: "admin" | "moderator" | "member",
  ) {
    return SocialGroupInteractionsService.updateGroupMemberRole(groupId, memberProfileId, role);
  }

  static async isMemberOfGroup(groupId: string, userId?: string) {
    return SocialGroupInteractionsService.isMemberOfGroup(groupId, userId);
  }

  static async getGroupMembers(groupId: string) {
    return SocialGroupInteractionsService.getGroupMembers(groupId);
  }

  static async sendGroupMessage(data: CreateGroupMessageData, userId?: string) {
    return SocialGroupInteractionsService.sendGroupMessage(data, userId);
  }

  static async getGroupMessages(groupId: string, limit: number = 50, offset: number = 0) {
    return SocialGroupInteractionsService.getGroupMessages(groupId, limit, offset);
  }

  static async deleteGroupMessage(messageId: string, userId?: string) {
    return SocialGroupInteractionsService.deleteGroupMessage(messageId, userId);
  }

  static async updateGroupMessage(messageId: string, content: string, userId?: string) {
    return SocialGroupInteractionsService.updateGroupMessage(messageId, content, userId);
  }

  static async reportGroupMessage(messageId: string, reason: string, details?: string, userId?: string) {
    return SocialGroupInteractionsService.reportGroupMessage(messageId, reason, details, userId);
  }

  static async getGroupMessageReports(groupId: string, userId?: string) {
    return SocialGroupInteractionsService.getGroupMessageReports(groupId, userId);
  }

  static async updateGroupMessageReportStatus(
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
    userId?: string,
  ) {
    return SocialGroupInteractionsService.updateGroupMessageReportStatus(reportId, status, userId);
  }


  /**
   * Buscar estatisticas de interacoes sociais para um profile
   * @param profileId - ID do perfil (profiles.id), nao user_id
   */
  static async getInteractionStats(
    profileId?: string,
  ): Promise<SocialInteractionStats> {
    try {
      // Se profileId nao fornecido, resolver via usuario autenticado
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
   * ? LOTE 7 - Delegado ao CommentService
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
   * ? LOTE 7 - Delegado ao CommentService
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
   * Verifica se esta seguindo um usuario
   */
  static async isFollowingUser(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    try {
      const { data } = await this.db
        .from<Pick<UserFollowRow, "id">>("user_follows")
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
   * Alterna follow/unfollow de um usuario
   */
  static async toggleFollowUser(
    followerId: string,
    followingId: string,
  ): Promise<{ action: "follow" | "unfollow"; error?: string }> {
    try {
      const { data: existing } = await this.db
        .from<Pick<UserFollowRow, "id">>("user_follows")
        .select("id")
        .eq("follower_id", followerId)
        .eq("following_id", followingId)
        .maybeSingle();

      if (existing) {
        const { error } = await this.db
          .from<UserFollowRow>("user_follows")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "unfollow" };
      } else {
        const { error } = await this.db
          .from<UserFollowRow>("user_follows")
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
        return { action: "follow" };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "erro desconhecido";
      return { action: "follow", error: message };
    }
  }

  /**
   * Busca IDs dos usuarios seguidos por um usuario
   */
  static async getFollowedUserIds(userId: string): Promise<string[]> {
    try {
      const { data } = await this.db
        .from<Pick<UserFollowRow, "following_id">>("user_follows")
        .select("following_id")
        .eq("follower_id", userId);
      return (data || []).map((f) => f.following_id);
    } catch {
      return [];
    }
  }

  /**
   * Busca IDs dos grupos em que o usuario e membro
   */
  static async getUserGroupIds(userId?: string) {
    return SocialGroupInteractionsService.getUserGroupIds(userId);
  }

  static async getGroupMessageById(messageId: string) {
    return SocialGroupInteractionsService.getGroupMessageById(messageId);
  }
}
