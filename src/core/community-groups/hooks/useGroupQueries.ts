import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { QUERY_KEYS } from "@/shared/utils/queryClient";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session"; // ✅ SSOT - Migrado de useAuth
import { SocialGroupInteractionsService } from "@/core/social/services/SocialGroupInteractionsService";
import { GroupService } from "@/core/social/services/GroupService";
import { realtimeService } from "@/core/realtime";
// Hooks are defined below and exported directly

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

// Types
interface GroupMessage {
  id: string;
  group_id: string;
  sender_profile_id: string; // ✅ GATE 3 FASE 3C - Atualizado para novo modelo
  content: string;
  message_type?: "text" | "image" | "audio" | "poll" | "system";
  media_url?: string | null;
  media_mime_type?: string | null;
  audio_duration_seconds?: number | null;
  created_at: string;
  profile?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  is_liked?: boolean;
}

export function useGroupMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.community.groupMessages(groupId || ""),
    queryFn: async () => {
      if (!groupId) return [];

      const messages = await SocialGroupInteractionsService.getGroupMessages(
        groupId,
        100,
        0,
      );
      return [...(messages as GroupMessage[])].reverse();
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!groupId) return;

    const subscription = realtimeService.subscribeToGroupMessages(
      groupId,
      async ({ eventType, row }) => {
        if (typeof row.id !== "string") return;

        const queryKey = QUERY_KEYS.community.groupMessages(groupId);
        if (eventType === "DELETE") {
          queryClient.setQueryData<GroupMessage[]>(queryKey, (current = []) =>
            current.filter((message) => message.id !== row.id),
          );
          return;
        }

        const fullMessage = await GroupService.getGroupMessageById(row.id);
        if (!fullMessage) return;

        const message = fullMessage as unknown as GroupMessage;
        queryClient.setQueryData<GroupMessage[]>(queryKey, (current = []) => {
          const withoutCurrentVersion = current.filter(
            (item) => item.id !== message.id,
          );

          return [...withoutCurrentVersion, message]
            .sort((left, right) =>
              left.created_at.localeCompare(right.created_at),
            )
            .slice(-100);
        });
      },
    );

    return () => subscription.unsubscribe();
  }, [groupId, queryClient]);

  return query;
}

// Hook for send mensagem
// ✅ SSOT Regra 1 - Migrado para activeProfile.id (contexto social: sender)
export function useSendGroupMessage() {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();

  return useMutation({
    mutationFn: async ({
      groupId,
      content,
      messageType,
      mediaUrl,
      mediaMimeType,
      audioDurationSeconds,
      metadata,
    }: {
      groupId: string;
      content: string;
      messageType?: "text" | "image" | "audio";
      mediaUrl?: string;
      mediaMimeType?: string;
      audioDurationSeconds?: number;
      metadata?: Record<string, unknown>;
    }) => {
      if (!activeProfile) {
        throw new Error("Usuário não autenticado");
      }

      // ✅ Contrato: sendGroupMessage(data, userId?) - userId é auth user_id, service resolve profile
      const result = await SocialGroupInteractionsService.sendGroupMessage(
        {
          groupId,
          content: content.trim(),
          messageType,
          mediaUrl,
          mediaMimeType,
          audioDurationSeconds,
          metadata,
        },
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar mensagem");
      }

      return result.message;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.groupMessages(groupId),
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Error send mensagem"));
    },
  });
}

// Hook for entrar no grupo
// ✅ SSOT Regra 1 - Migrado para activeProfile.id (contexto social: join group)
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!activeProfile) throw new Error("Usuário não autenticado");

      // The database fixes the role to member and validates local eligibility.
      const result = await SocialGroupInteractionsService.joinGroup(
        groupId,
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao entrar no grupo");
      }

      return result;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.groupMembers(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: ["group-membership", groupId, activeProfile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.group(groupId),
      });

      toast.success("Você entrou no grupo!");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Error entrar no grupo"));
    },
  });
}

// Hook for sair do grupo
// ✅ SSOT Regra 1 - Migrado para activeProfile.id (contexto social: leave group)
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { activeProfile } = useSessionContext();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!activeProfile) throw new Error("Usuário não autenticado");

      // ✅ Contrato: leaveGroup(groupId, userId?) - userId é auth user_id, service resolve profile
      const result = await SocialGroupInteractionsService.leaveGroup(
        groupId,
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao sair do grupo");
      }

      return result;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.groupMembers(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: ["group-membership", groupId, activeProfile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.community.group(groupId),
      });

      toast.success("Você saiu do grupo");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Error sair do grupo"));
    },
  });
}

export function useUpdateGroupMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      memberProfileId,
      role,
    }: {
      groupId: string;
      memberProfileId: string;
      role: "admin" | "moderator" | "member";
    }) => {
      const result = await SocialGroupInteractionsService.updateGroupMemberRole(groupId, memberProfileId, role);
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar função");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.groupMembers(groupId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Erro ao atualizar função"));
    },
  });
}

export function useDeleteGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
      const result = await SocialGroupInteractionsService.deleteGroupMessage(messageId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao remover mensagem");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.groupMessages(groupId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Erro ao remover mensagem"));
    },
  });
}

export function useUpdateGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      messageId,
      content,
    }: {
      groupId: string;
      messageId: string;
      content: string;
    }) => {
      const result = await SocialGroupInteractionsService.updateGroupMessage(messageId, content);
      if (!result.success) {
        throw new Error(result.error || "Erro ao editar mensagem");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.groupMessages(groupId) });
      toast.success("Mensagem atualizada");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Erro ao editar mensagem"));
    },
  });
}

export function useReportGroupMessage() {
  return useMutation({
    mutationFn: async ({
      messageId,
      reason,
      details,
    }: {
      messageId: string;
      reason: string;
      details?: string;
    }) => {
      const result = await SocialGroupInteractionsService.reportGroupMessage(messageId, reason, details);
      if (!result.success) {
        throw new Error(result.error || "Erro ao denunciar mensagem");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Denúncia enviada para moderação");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Erro ao denunciar mensagem"));
    },
  });
}

export function useToggleGroupMessageLike(groupId: string) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.community.groupMessages(groupId);

  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await SocialGroupInteractionsService.toggleGroupMessageLike(
        messageId,
      );
      if (!result.success || !result.state) {
        throw new Error(result.error || "Erro ao reagir a mensagem");
      }
      return result.state;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<GroupMessage[]>(queryKey);
      queryClient.setQueryData<GroupMessage[]>(queryKey, (current = []) =>
        current.map((message) => {
          if (message.id !== messageId) return message;
          const isLiked = Boolean(message.is_liked);
          return {
            ...message,
            is_liked: !isLiked,
            likes_count: isLiked
              ? Math.max(0, (message.likes_count ?? 0) - 1)
              : (message.likes_count ?? 0) + 1,
          };
        }),
      );
      return { previous };
    },
    onError: (error: unknown, _messageId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(getErrorMessage(error, "Erro ao reagir a mensagem"));
    },
    onSuccess: (state) => {
      queryClient.setQueryData<GroupMessage[]>(queryKey, (current = []) =>
        current.map((message) =>
          message.id === state.message_id
            ? {
                ...message,
                likes_count: Number(state.likes_count),
                is_liked: Boolean(state.is_liked),
              }
            : message,
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useGroupMessageReports(groupId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["group-message-reports", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      return SocialGroupInteractionsService.getGroupMessageReports(groupId);
    },
    enabled: !!groupId && enabled,
    staleTime: 30 * 1000,
  });
}

export function useUpdateGroupMessageReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      reportId,
      status,
    }: {
      groupId: string;
      reportId: string;
      status: "reviewing" | "resolved" | "dismissed";
    }) => {
      const result = await SocialGroupInteractionsService.updateGroupMessageReportStatus(
        reportId,
        status,
      );
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar denúncia");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["group-message-reports", groupId] });
      toast.success("Status da denúncia atualizado");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Erro ao atualizar denúncia"));
    },
  });
}
