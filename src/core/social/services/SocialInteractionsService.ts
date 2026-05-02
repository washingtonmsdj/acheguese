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

const MOCK_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: "mock-msg-1",
    group_id: "mock-avisos-complexo",
    sender_profile_id: "mock-admin-profile",
    content: "Bom dia, pessoal. Hoje teremos limpeza comunitaria na praca principal as 08h.",
    message_type: "text",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    profile: {
      id: "mock-admin-profile",
      name: "Admin Comunidade",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Admin%20Comunidade",
    },
  },
  {
    id: "mock-msg-2",
    group_id: "mock-avisos-complexo",
    sender_profile_id: "mock-mod-1",
    content: "Mapa do ponto de encontro:",
    message_type: "image",
    media_url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80&auto=format&fit=crop",
    media_mime_type: "image/jpeg",
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    profile: {
      id: "mock-mod-1",
      name: "Lideranca Nordeste",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Lideranca%20Nordeste",
    },
  },
  {
    id: "mock-msg-3",
    group_id: "mock-avisos-complexo",
    sender_profile_id: "mock-member-2",
    content: "Atualizacao em audio da ronda comunitaria",
    message_type: "audio",
    media_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    media_mime_type: "audio/mpeg",
    audio_duration_seconds: 18,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    profile: {
      id: "mock-member-2",
      name: "Carlos Vale",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Carlos%20Vale",
    },
  },
  {
    id: "mock-msg-4",
    group_id: "mock-empreendedores-servicos",
    sender_profile_id: "mock-admin-2",
    content: "Feira local de empreendedores confirmada para sabado.",
    message_type: "text",
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    profile: {
      id: "mock-admin-2",
      name: "Rede de Comerciantes",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Rede%20de%20Comerciantes",
    },
  },
  {
    id: "mock-msg-5",
    group_id: "mock-empreendedores-servicos",
    sender_profile_id: "mock-member-3",
    content: "Cardapio novo da semana:",
    message_type: "image",
    media_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format&fit=crop",
    media_mime_type: "image/jpeg",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    profile: {
      id: "mock-member-3",
      name: "Morador Empreendedor",
      avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=Morador%20Empreendedor",
    },
  },
];

const MOCK_GROUP_MESSAGE_REPORTS: Array<{
  id: string;
  group_id: string;
  message_id: string;
  reporter_profile_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  moderation_history?: Array<{
    at: string;
    status: string;
    moderator_profile_id?: string;
  }>;
  created_at: string;
}> = [];

export class SocialInteractionsService {
  private static async resolveGroupContext(groupId: string, userId?: string) {
    const { data: groupRow } = await (supabase as any)
      .from("groups")
      .select("id, posting_policy, join_policy")
      .eq("id", groupId)
      .maybeSingle();

    if (!groupRow) {
      return {
        group: null,
        role: null as "admin" | "moderator" | "member" | null,
      };
    }

    const activeProfile = userId
      ? await profileService.getRequiredActiveProfile(userId)
      : await profileService.getRequiredActiveProfile();

    const { data: membership } = await (supabase as any)
      .from("group_members_new")
      .select("role")
      .eq("group_id", groupId)
      .eq("member_profile_id", activeProfile.id)
      .maybeSingle();

    return {
      group: groupRow as { id: string; posting_policy?: string; join_policy?: string },
      role: (membership?.role as "admin" | "moderator" | "member" | undefined) || null,
      activeProfileId: activeProfile.id,
    };
  }
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

  static async updateGroupMemberRole(
    groupId: string,
    memberProfileId: string,
    role: "admin" | "moderator" | "member",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile = await profileService.getRequiredActiveProfile();

      const { data: requesterMembership, error: requesterError } = await (supabase as any)
        .from("group_members_new")
        .select("role")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .single();

      if (requesterError) throw requesterError;
      if (!["admin", "moderator"].includes(requesterMembership?.role)) {
        return { success: false, error: "Apenas admins ou moderadores podem alterar funcoes" };
      }

      const { error } = await (supabase as any)
        .from("group_members_new")
        .update({ role })
        .eq("group_id", groupId)
        .eq("member_profile_id", memberProfileId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "updateGroupMemberRole",
        metadata: { groupId, memberProfileId, role },
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
      if (data.groupId.startsWith("mock-")) {
        const now = new Date().toISOString();
        const mockMessage: GroupMessage = {
          id: `mock-local-${Date.now()}`,
          group_id: data.groupId,
          sender_profile_id: "mock-current-user",
          content: data.content,
          message_type: data.messageType || "text",
          media_url: data.mediaUrl || null,
          media_mime_type: data.mediaMimeType || null,
          audio_duration_seconds:
            typeof data.audioDurationSeconds === "number"
              ? data.audioDurationSeconds
              : null,
          created_at: now,
          profile: {
            id: "mock-current-user",
            name: "Você",
            avatar_url:
              "https://api.dicebear.com/9.x/initials/svg?seed=Voce%20Morador",
          },
        };
        MOCK_GROUP_MESSAGES.push(mockMessage);
        return { success: true, message: mockMessage };
      }

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data: groupPolicy } = await (supabase as any)
        .from("groups")
        .select("posting_policy")
        .eq("id", data.groupId)
        .maybeSingle();
      const { data: membership } = await (supabase as any)
        .from("group_members_new")
        .select("role")
        .eq("group_id", data.groupId)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();

      if (!membership) {
        return { success: false, error: "Voce precisa entrar no grupo para postar" };
      }

      const role = membership.role as "admin" | "moderator" | "member";
      const postingPolicy = groupPolicy?.posting_policy || "members";
      const canPost =
        postingPolicy === "members" ||
        (postingPolicy === "moderators" && ["admin", "moderator"].includes(role)) ||
        (postingPolicy === "admins" && role === "admin");

      if (!canPost) {
        return {
          success: false,
          error: "Este grupo limita postagens por funcao. Verifique as regras do grupo.",
        };
      }

      const payload: Record<string, unknown> = {
        group_id: data.groupId,
        sender_profile_id: activeProfile.id,
        content: data.content,
      };

      if (data.messageType && data.messageType !== "text") payload.message_type = data.messageType;
      if (data.mediaUrl) payload.media_url = data.mediaUrl;
      if (data.mediaMimeType) payload.media_mime_type = data.mediaMimeType;
      if (typeof data.audioDurationSeconds === "number") {
        payload.audio_duration_seconds = data.audioDurationSeconds;
      }
      if (data.metadata) payload.metadata = data.metadata;

      const { data: message, error } = await (supabase as any)
        .from("group_messages_new")
        .insert(payload)
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

      if ((!data || data.length === 0) && groupId.startsWith("mock-")) {
        return MOCK_GROUP_MESSAGES
          .filter((message) => message.group_id === groupId)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(offset, offset + limit);
      }

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getGroupMessages",
        metadata: { groupId, limit, offset },
      });
      if (groupId.startsWith("mock-")) {
        return MOCK_GROUP_MESSAGES
          .filter((message) => message.group_id === groupId)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(offset, offset + limit);
      }
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

      const { data: messageRow, error: messageFetchError } = await (supabase as any)
        .from("group_messages_new")
        .select("id, group_id, sender_profile_id")
        .eq("id", messageId)
        .maybeSingle();

      if (messageFetchError) throw messageFetchError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };

      const { data: membership } = await (supabase as any)
        .from("group_members_new")
        .select("role")
        .eq("group_id", messageRow.group_id)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();

      const isOwn = messageRow.sender_profile_id === activeProfile.id;
      const canModerate = ["admin", "moderator"].includes(membership?.role || "");
      if (!isOwn && !canModerate) {
        return { success: false, error: "Sem permissao para remover esta mensagem" };
      }

      const { error } = await (supabase as any)
        .from("group_messages_new")
        .delete()
        .eq("id", messageId)
        .eq("id", messageId);

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

  static async updateGroupMessage(
    messageId: string,
    content: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!content.trim()) {
        return { success: false, error: "Mensagem vazia" };
      }

      const mockMessage = MOCK_GROUP_MESSAGES.find((message) => message.id === messageId);
      if (mockMessage) {
        mockMessage.content = content.trim();
        mockMessage.metadata = {
          ...(mockMessage.metadata || {}),
          edited: true,
          edited_at: new Date().toISOString(),
        };
        return { success: true };
      }

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: messageRow, error: messageError } = await (supabase as any)
        .from("group_messages_new")
        .select("id, sender_profile_id")
        .eq("id", messageId)
        .maybeSingle();
      if (messageError) throw messageError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };
      if (messageRow.sender_profile_id !== activeProfile.id) {
        return { success: false, error: "Somente o autor pode editar a mensagem" };
      }

      const { error } = await (supabase as any)
        .from("group_messages_new")
        .update({
          content: content.trim(),
          metadata: {
            edited: true,
            edited_at: new Date().toISOString(),
          },
        })
        .eq("id", messageId)
        .eq("sender_profile_id", activeProfile.id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "updateGroupMessage",
        metadata: { messageId },
      });
      return { success: false, error: (error as Error).message };
    }
  }

  static async reportGroupMessage(
    messageId: string,
    reason: string,
    details?: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!reason || reason.trim().length < 3) {
        return { success: false, error: "Motivo da denuncia muito curto" };
      }

      const mockMessage = MOCK_GROUP_MESSAGES.find((message) => message.id === messageId);
      if (mockMessage) {
        MOCK_GROUP_MESSAGE_REPORTS.push({
          id: `mock-report-${Date.now()}`,
          group_id: mockMessage.group_id,
          message_id: messageId,
          reporter_profile_id: "mock-current-user",
          reason: reason.trim(),
          details: details?.trim() || null,
          status: "pending",
          created_at: new Date().toISOString(),
        });
        return { success: true };
      }

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: messageRow, error: messageError } = await (supabase as any)
        .from("group_messages_new")
        .select("id, group_id, sender_profile_id")
        .eq("id", messageId)
        .maybeSingle();

      if (messageError) throw messageError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };

      if (messageRow.sender_profile_id === activeProfile.id) {
        return { success: false, error: "Nao e possivel denunciar a propria mensagem" };
      }

      const payload = {
        group_id: messageRow.group_id,
        message_id: messageId,
        reporter_profile_id: activeProfile.id,
        reason: reason.trim(),
        details: details?.trim() || null,
      };

      const { error } = await (supabase as any).from("group_message_reports").insert(payload);
      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "Voce ja denunciou esta mensagem" };
        }
        throw error;
      }
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialInteractionsService",
        action: "reportGroupMessage",
        metadata: { messageId },
      });
      return { success: false, error: err.message };
    }
  }

  static async getGroupMessageReports(
    groupId: string,
    userId?: string,
  ): Promise<
    Array<{
      id: string;
      message_id: string;
      reason: string;
      details?: string | null;
      status: string;
      created_at: string;
      moderation_history?: Array<{
        at: string;
        status: string;
        moderator_profile_id?: string;
      }>;
      message?: {
        id: string;
        content: string;
        message_type?: string;
        created_at: string;
        sender_profile_id: string;
        profile?: { id: string; name: string; avatar_url?: string | null };
      } | null;
    }>
  > {
    try {
      if (groupId.startsWith("mock-")) {
        return MOCK_GROUP_MESSAGE_REPORTS.filter((r) => r.group_id === groupId);
      }

      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: membership } = await (supabase as any)
        .from("group_members_new")
        .select("role")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();

      if (!["admin", "moderator"].includes(membership?.role || "")) {
        return [];
      }

      const { data, error } = await (supabase as any)
        .from("group_message_reports")
        .select(`
          id,
          message_id,
          reason,
          details,
          status,
          moderation_history,
          created_at,
          message:group_messages_new!group_message_reports_message_id_fkey(
            id,
            content,
            message_type,
            created_at,
            sender_profile_id,
            profile:profiles!group_messages_new_sender_profile_id_fkey(id,name,avatar_url)
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "getGroupMessageReports",
        metadata: { groupId },
      });
      return [];
    }
  }

  static async updateGroupMessageReportStatus(
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data: reportRow, error: reportError } = await (supabase as any)
        .from("group_message_reports")
        .select("id, group_id")
        .eq("id", reportId)
        .maybeSingle();
      if (reportError) throw reportError;
      if (!reportRow) return { success: false, error: "Denuncia nao encontrada" };

      const { data: membership } = await (supabase as any)
        .from("group_members_new")
        .select("role")
        .eq("group_id", reportRow.group_id)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();
      if (!["admin", "moderator"].includes(membership?.role || "")) {
        return { success: false, error: "Sem permissao para moderar denuncias" };
      }

      const { data: currentReport, error: currentReportError } = await (supabase as any)
        .from("group_message_reports")
        .select("moderation_history")
        .eq("id", reportId)
        .maybeSingle();
      if (currentReportError) throw currentReportError;

      const previousHistory = Array.isArray(currentReport?.moderation_history)
        ? currentReport.moderation_history
        : [];
      const nextHistory = [
        ...previousHistory,
        {
          at: new Date().toISOString(),
          status,
          moderator_profile_id: activeProfile.id,
        },
      ];

      const { error } = await (supabase as any)
        .from("group_message_reports")
        .update({
          status,
          reviewed_by: activeProfile.id,
          reviewed_at: new Date().toISOString(),
          moderation_history: nextHistory,
        })
        .eq("id", reportId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialInteractionsService",
        action: "updateGroupMessageReportStatus",
        metadata: { reportId, status },
      });
      return { success: false, error: (error as Error).message };
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
  updateGroupMemberRole: SocialInteractionsService.updateGroupMemberRole,
  getUserGroupIds: SocialInteractionsService.getUserGroupIds,

  // Group Messages
  sendGroupMessage: SocialInteractionsService.sendGroupMessage,
  getGroupMessages: SocialInteractionsService.getGroupMessages,
  deleteGroupMessage: SocialInteractionsService.deleteGroupMessage,
  updateGroupMessage: SocialInteractionsService.updateGroupMessage,
  getGroupMessageById: SocialInteractionsService.getGroupMessageById,
  reportGroupMessage: SocialInteractionsService.reportGroupMessage,
  getGroupMessageReports: SocialInteractionsService.getGroupMessageReports,
  updateGroupMessageReportStatus: SocialInteractionsService.updateGroupMessageReportStatus,

  // Comment Likes
  likeComment: SocialInteractionsService.likeComment,
  unlikeComment: SocialInteractionsService.unlikeComment,

  // Follows
  getFollowedUserIds: SocialInteractionsService.getFollowedUserIds,

  // Stats
  getInteractionStats: SocialInteractionsService.getInteractionStats,
} as const;
