import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/utils/queryClient";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session"; // ✅ SSOT - Migrado de useAuth
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; // ✅ GATE 3 FASE 3C
import { CommunityService } from "@/core/community/services/CommunityService"; // ✅ LOTE 7
// Hooks are defined below and exported directly

// Types
interface Group {
  id: string;
  name: string;
  description: string;
  slug: string;
  cover_image?: string;
  created_by: string;
  members_count: number;
  is_public: boolean;
  rules?: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

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
}

// Hook for list grupos
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: async () => {
      // ✅ LOTE 7 - CommunityService.getGroups
      const data = await CommunityService.getGroups();
      return data as Group[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook for search grupo por ID
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.group(groupId || ""),
    queryFn: async () => {
      // ✅ LOTE 7 - CommunityService.getGroupById
      const data = await CommunityService.getGroupById(groupId!);
      if (!data) throw new Error("Grupo não encontrado");
      return data as Group;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook for mensagens do grupo
export function useGroupMessages(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupMessages(groupId || ""),
    queryFn: async () => {
      if (!groupId) return [];

      // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
      const messages = await SocialInteractionsService.getGroupMessages(
        groupId,
        100,
        0,
      );
      return messages as GroupMessage[];
    },
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 segundos (mensagens são mais dinâmicas)
  });
}

// Hook for membros do grupo
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId || ""),
    queryFn: async () => {
      if (!groupId) return [];

      // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
      const members = await SocialInteractionsService.getGroupMembers(groupId);
      return members;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook for verify se usuário é membro
// ✅ SSOT Regra 1 - Migrado para activeProfile.id (contexto social: membership)
export function useIsGroupMember(groupId: string | undefined) {
  const { activeProfile } = useSessionContext();

  return useQuery({
    queryKey: ["group-membership", groupId, activeProfile?.id],
    queryFn: async () => {
      if (!activeProfile?.id || !groupId) return false;

      // ✅ Contrato: isMemberOfGroup(groupId, userId?) - userId é auth user_id, service resolve profile
      return await SocialInteractionsService.isMemberOfGroup(
        groupId,
        activeProfile.userId,
      );
    },
    enabled: !!activeProfile?.id && !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
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
      const result = await SocialInteractionsService.sendGroupMessage(
        {
          groupId,
          content: content.trim(),
          messageType,
          mediaUrl,
          mediaMimeType,
          audioDurationSeconds,
          metadata,
        },
        activeProfile?.userId,
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao enviar mensagem");
      }

      return result.message;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupMessages(groupId),
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error send mensagem");
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

      // ✅ Contrato: joinGroup(groupId, userId?, role) - userId é auth user_id, service resolve profile
      const result = await SocialInteractionsService.joinGroup(
        groupId,
        activeProfile.userId,
        "member",
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao entrar no grupo");
      }

      return result;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupMembers(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: ["group-membership", groupId, activeProfile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.group(groupId),
      });

      toast.success("Você entrou no grupo!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error entrar no grupo");
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
      const result = await SocialInteractionsService.leaveGroup(
        groupId,
        activeProfile.userId,
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao sair do grupo");
      }

      return result;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupMembers(groupId),
      });
      queryClient.invalidateQueries({
        queryKey: ["group-membership", groupId, activeProfile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.group(groupId),
      });

      toast.success("Você saiu do grupo");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error sair do grupo");
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
      const result = await SocialInteractionsService.updateGroupMemberRole(groupId, memberProfileId, role);
      if (!result.success) {
        throw new Error(result.error || "Erro ao atualizar função");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar função");
    },
  });
}

export function useDeleteGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, messageId }: { groupId: string; messageId: string }) => {
      const result = await SocialInteractionsService.deleteGroupMessage(messageId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao remover mensagem");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMessages(groupId) });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover mensagem");
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
      const result = await SocialInteractionsService.updateGroupMessage(messageId, content);
      if (!result.success) {
        throw new Error(result.error || "Erro ao editar mensagem");
      }
      return result;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMessages(groupId) });
      toast.success("Mensagem atualizada");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao editar mensagem");
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
      const result = await SocialInteractionsService.reportGroupMessage(messageId, reason, details);
      if (!result.success) {
        throw new Error(result.error || "Erro ao denunciar mensagem");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Denúncia enviada para moderação");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao denunciar mensagem");
    },
  });
}

export function useGroupMessageReports(groupId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["group-message-reports", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      return SocialInteractionsService.getGroupMessageReports(groupId);
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
      const result = await SocialInteractionsService.updateGroupMessageReportStatus(
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
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar denúncia");
    },
  });
}
