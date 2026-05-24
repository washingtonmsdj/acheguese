/**
 * Social group interactions service.
 *
 * SSOT for group membership and group message interactions.
 */

import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  CreateGroupMessageData,
  GroupMember,
  GroupMessage,
} from "@/core/social/types";

export class SocialGroupInteractionsService {
  private static readonly db = supabase as any;
  private static async resolveGroupContext(groupId: string, userId?: string) {
    const { data: groupRow } = await this.db.rpc("get_community_group_by_id", {
      p_group_id: groupId,
    });

    if (!groupRow) {
      return {
        group: null,
        role: null as "admin" | "moderator" | "member" | null,
      };
    }

    const activeProfile = userId
      ? await profileService.getRequiredActiveProfile(userId)
      : await profileService.getRequiredActiveProfile();

    const { data: membership } = await this.db
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

      const { error } = await this.db
        .from("group_members_new")
        .insert({
          group_id: groupId,
          member_profile_id: activeProfile.id,
          role,
        });

      if (error) {
        // Ignorar erro de duplicata (ja e membro)
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

      const { error } = await this.db
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

      const { data: requesterMembership, error: requesterError } = await this.db
        .from("group_members_new")
        .select("role")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .single();

      if (requesterError) throw requesterError;
      if (!["admin", "moderator"].includes(requesterMembership?.role)) {
        return { success: false, error: "Apenas admins ou moderadores podem alterar funcoes" };
      }

      const { error } = await this.db
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
   * Verificar se profile e membro de um grupo
   */
  static async isMemberOfGroup(
    groupId: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await this.db
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
      const { data, error } = await this.db
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

      const { data: groupPolicy } = await this.db.rpc("get_community_group_by_id", {
        p_group_id: data.groupId,
      });
      const { data: membership } = await this.db
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

      const { data: message, error } = await this.db
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
      const { data, error } = await this.db
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

      const { data: messageRow, error: messageFetchError } = await this.db
        .from("group_messages_new")
        .select("id, group_id, sender_profile_id")
        .eq("id", messageId)
        .maybeSingle();

      if (messageFetchError) throw messageFetchError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };

      const { data: membership } = await this.db
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

      const { error } = await this.db
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
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: messageRow, error: messageError } = await this.db
        .from("group_messages_new")
        .select("id, sender_profile_id")
        .eq("id", messageId)
        .maybeSingle();
      if (messageError) throw messageError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };
      if (messageRow.sender_profile_id !== activeProfile.id) {
        return { success: false, error: "Somente o autor pode editar a mensagem" };
      }

      const { error } = await this.db
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
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: messageRow, error: messageError } = await this.db
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

      const { error } = await this.db.from("group_message_reports").insert(payload);
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
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      const { data: membership } = await this.db
        .from("group_members_new")
        .select("role")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();

      if (!["admin", "moderator"].includes(membership?.role || "")) {
        return [];
      }

      const { data, error } = await this.db
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

      const { data: reportRow, error: reportError } = await this.db
        .from("group_message_reports")
        .select("id, group_id")
        .eq("id", reportId)
        .maybeSingle();
      if (reportError) throw reportError;
      if (!reportRow) return { success: false, error: "Denuncia nao encontrada" };

      const { data: membership } = await this.db
        .from("group_members_new")
        .select("role")
        .eq("group_id", reportRow.group_id)
        .eq("member_profile_id", activeProfile.id)
        .maybeSingle();
      if (!["admin", "moderator"].includes(membership?.role || "")) {
        return { success: false, error: "Sem permissao para moderar denuncias" };
      }

      const { data: currentReport, error: currentReportError } = await this.db
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

      const { error } = await this.db
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

  /**
   * Busca IDs dos grupos em que o usuario e membro
   */
  static async getUserGroupIds(userId?: string): Promise<string[]> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);

      const { data, error } = await this.db
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
  static async getGroupMessageById(messageId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await this.db
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
