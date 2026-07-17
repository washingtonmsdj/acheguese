/**
 * Social group interactions service.
 *
 * SSOT for group membership and group message interactions.
 */

import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { COMMUNITY_RUNTIME_LIMITS } from "@/shared/constants/communityRuntime";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  CreateGroupMessageData,
  GroupMember,
  GroupMessage,
} from "@/core/social/types";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  range(from: number, to: number): QueryBuilder<TRow>;
  limit(count: number): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface SocialGroupDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

interface GroupReactionStateRow {
  message_id: string;
  likes_count: number;
  is_liked: boolean;
}

interface GroupReactionRpcClient {
  rpc(
    functionName: "list_group_message_reaction_state",
    params: { p_message_ids: string[] },
  ): Promise<{ data: GroupReactionStateRow[] | null; error: { message?: string } | null }>;
  rpc(
    functionName: "toggle_group_message_like",
    params: { p_message_id: string },
  ): Promise<{ data: GroupReactionStateRow | null; error: { message?: string } | null }>;
}

type GroupMemberRow = Database["public"]["Tables"]["group_members_new"]["Row"];
type GroupMessageRow = Database["public"]["Tables"]["group_messages_new"]["Row"];
type GroupMessageReportRow =
  Database["public"]["Tables"]["group_message_reports"]["Row"];

function boundedInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

interface GroupMessageWithProfileRow extends GroupMessageRow {
  profile?:
    | { id: string; name: string; avatar_url?: string | null }
    | Array<{ id: string; name: string; avatar_url?: string | null }>
    | null;
}

interface GroupMessageReportListRow {
  id: string;
  message_id: string;
  reason: string;
  details?: string | null;
  status: string;
  moderation_history?: Json;
  created_at: string;
  message?: {
    id: string;
    content: string;
    message_type?: string;
    created_at: string;
    sender_profile_id: string;
    profile?:
      | { id: string; name: string; avatar_url?: string | null }
      | Array<{ id: string; name: string; avatar_url?: string | null }>
      | null;
  } | null;
}

interface ModerationHistoryItem {
  at: string;
  status: string;
  moderator_profile_id?: string;
}

function asModerationHistory(value: Json | undefined): ModerationHistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const history: ModerationHistoryItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    if (typeof candidate.at !== "string" || typeof candidate.status !== "string") {
      continue;
    }

    history.push({
      at: candidate.at,
      status: candidate.status,
      moderator_profile_id:
        typeof candidate.moderator_profile_id === "string"
          ? candidate.moderator_profile_id
          : undefined,
    });
  }

  return history;
}

export class SocialGroupInteractionsService {
  private static readonly db = supabase as unknown as SocialGroupDbClient;
  private static readonly reactionRpc =
    supabase as unknown as GroupReactionRpcClient;

  /**
   * Entrar em um grupo usando profile ativo
   */
  static async joinGroup(
    groupId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db
        .from<GroupMemberRow>("group_members_new")
        .insert({
          group_id: groupId,
          member_profile_id: activeProfile.id,
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
        component: "SocialGroupInteractionsService",
        action: "joinGroup",
        metadata: { groupId },
      });
      return { success: false, error: err.message };
    }
  }

  /**
   * Sair de um grupo usando profile ativo
   */
  static async leaveGroup(
    groupId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { error } = await this.db
        .from<GroupMemberRow>("group_members_new")
        .delete()
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialGroupInteractionsService",
        action: "leaveGroup",
        metadata: { groupId },
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
      const { error } = await this.db
        .from<GroupMemberRow>("group_members_new")
        .update({ role })
        .eq("group_id", groupId)
        .eq("member_profile_id", memberProfileId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialGroupInteractionsService",
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
  ): Promise<boolean> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const { data, error } = await this.db
        .from<Pick<GroupMemberRow, "id">>("group_members_new")
        .select("id")
        .eq("group_id", groupId)
        .eq("member_profile_id", activeProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "isMemberOfGroup",
        metadata: { groupId },
      });
      return false;
    }
  }

  /**
   * Buscar membros de um grupo
   */
  static async getGroupMembers(
    groupId: string,
    limit = 50,
  ): Promise<GroupMember[]> {
    try {
      const { data, error } = await this.db
        .from<GroupMember>("group_members_new")
        .select(
          `
          *,
          profile:member_profile_id(id, name, avatar_url)
        `,
        )
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true })
        .limit(boundedInteger(limit, 1, 100));

      if (error) throw error;

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "getGroupMembers",
        metadata: { groupId, limit },
      });
      return [];
    }
  }

  /**
   * Enviar mensagem em um grupo usando profile ativo
   */
  static async sendGroupMessage(
    data: CreateGroupMessageData,
  ): Promise<{ success: boolean; message?: GroupMessage; error?: string }> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile();

      const payload: Partial<Database["public"]["Tables"]["group_messages_new"]["Insert"]> = {
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
      if (data.metadata) payload.metadata = data.metadata as Json;

      const { data: message, error } = await this.db
        .from<GroupMessage>("group_messages_new")
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
        component: "SocialGroupInteractionsService",
        action: "sendGroupMessage",
        metadata: { groupId: data.groupId },
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
      const boundedLimit = boundedInteger(
        limit,
        1,
        COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_SIZE,
      );
      if (
        Number.isFinite(offset) &&
        offset > COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX
      ) {
        return [];
      }
      const boundedOffset = boundedInteger(
        offset,
        0,
        COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX,
      );
      const { data, error } = await this.db
        .from<GroupMessage>("group_messages_new")
        .select(
          `
          *,
          profile:sender_profile_id(id, name, avatar_url)
        `,
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .range(boundedOffset, boundedOffset + boundedLimit - 1);

      if (error) throw error;
      const messages = data || [];
      const reactionStates = await this.getGroupMessageReactionStates(
        messages.map((message) => message.id),
      );
      return messages.map((message) => ({
        ...message,
        likes_count: reactionStates.get(message.id)?.likes_count ?? 0,
        is_liked: reactionStates.get(message.id)?.is_liked ?? false,
      }));
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "getGroupMessages",
        metadata: { groupId, limit, offset },
      });
      return [];
    }
  }

  static async getGroupMessageReactionStates(
    messageIds: string[],
  ): Promise<Map<string, GroupReactionStateRow>> {
    const uniqueMessageIds = [...new Set(messageIds)].slice(0, 100);
    if (uniqueMessageIds.length === 0) return new Map();

    try {
      const { data, error } = await this.reactionRpc.rpc(
        "list_group_message_reaction_state",
        { p_message_ids: uniqueMessageIds },
      );
      if (error) throw error;
      return new Map((data ?? []).map((state) => [state.message_id, state]));
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "getGroupMessageReactionStates",
        metadata: { messageCount: uniqueMessageIds.length },
      });
      return new Map();
    }
  }

  static async toggleGroupMessageLike(
    messageId: string,
  ): Promise<{ success: boolean; state?: GroupReactionStateRow; error?: string }> {
    try {
      const { data, error } = await this.reactionRpc.rpc(
        "toggle_group_message_like",
        { p_message_id: messageId },
      );
      if (error) throw error;
      if (!data) throw new Error("Estado da reacao nao retornado");
      return { success: true, state: data };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "toggleGroupMessageLike",
        metadata: { messageId },
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Deletar mensagem de grupo (apenas o autor pode deletar)
   */
  static async deleteGroupMessage(
    messageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.db
        .from<GroupMessageRow>("group_messages_new")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      trackError(err, {
        component: "SocialGroupInteractionsService",
        action: "deleteGroupMessage",
        metadata: { messageId },
      });
      return { success: false, error: err.message };
    }
  }

  static async updateGroupMessage(
    messageId: string,
    content: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!content.trim()) {
        return { success: false, error: "Mensagem vazia" };
      }

      const { error } = await this.db
        .from<GroupMessageRow>("group_messages_new")
        .update({ content: content.trim() })
        .eq("id", messageId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!reason || reason.trim().length < 3) {
        return { success: false, error: "Motivo da denuncia muito curto" };
      }
      const activeProfile =
        await profileService.getRequiredActiveProfile();
      const { data: messageRow, error: messageError } = await this.db
        .from<Pick<GroupMessageRow, "id" | "group_id">>(
          "group_messages_new",
        )
        .select("id, group_id")
        .eq("id", messageId)
        .maybeSingle();

      if (messageError) throw messageError;
      if (!messageRow) return { success: false, error: "Mensagem nao encontrada" };

      const payload = {
        group_id: messageRow.group_id,
        message_id: messageId,
        reporter_profile_id: activeProfile.id,
        reason: reason.trim(),
        details: details?.trim() || null,
      };

      const { error } = await this.db
        .from<GroupMessageReportRow>("group_message_reports")
        .insert(payload);
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
        component: "SocialGroupInteractionsService",
        action: "reportGroupMessage",
        metadata: { messageId },
      });
      return { success: false, error: err.message };
    }
  }

  static async getGroupMessageReports(
    groupId: string,
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
      const { data, error } = await this.db
        .from<GroupMessageReportListRow>("group_message_reports")
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
      return (data || []).map((report) => ({
        ...report,
        moderation_history: asModerationHistory(report.moderation_history),
        message: report.message
          ? {
              ...report.message,
              profile: Array.isArray(report.message.profile)
                ? report.message.profile[0] || null
                : report.message.profile,
            }
          : null,
      }));
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "getGroupMessageReports",
        metadata: { groupId },
      });
      return [];
    }
  }

  static async updateGroupMessageReportStatus(
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.db
        .from<GroupMessageReportRow>("group_message_reports")
        .update({ status })
        .eq("id", reportId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      trackError(error as Error, {
        component: "SocialGroupInteractionsService",
        action: "updateGroupMessageReportStatus",
        metadata: { reportId, status },
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Busca mensagem de grupo por ID
   */
  static async getGroupMessageById(messageId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await this.db
        .from<GroupMessageWithProfileRow>("group_messages_new")
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
        component: "SocialGroupInteractionsService",
        action: "getGroupMessageById",
        metadata: { messageId },
      });
      return null;
    }
  }
}
