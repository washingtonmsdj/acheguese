// Hook profissional para gerenciar grupos da comunidade
import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { USER_ROLE } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { GroupService, type Group } from "@/core/social/services/GroupService";

export type { Group };

export function useGroups() {
  const { user, activeProfile } = useSessionContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await GroupService.getGroups();
      const memberGroupIds = activeProfile
        ? await GroupService.getUserGroupIds(activeProfile.id)
        : [];

      const enriched = data.map((g: Group) => ({
        ...g,
        is_member: memberGroupIds.includes(g.id),
      }));

      setGroups(enriched);
      setMyGroups(
        enriched.filter((g: Group & { is_member?: boolean }) => g.is_member),
      );
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      logger.error("Error loading groups:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = useCallback(
    async (groupData: {
      name: string;
      description?: string;
      category?: string;
      is_private?: boolean;
    }) => {
      if (!user || !activeProfile) throw new Error("Precisa estar logado");

      const newGroup = await GroupService.createGroup({
        ...groupData,
        created_by: activeProfile.id,
      });

      const joinResult = await SocialInteractionsService.joinGroup(
        newGroup.id,
        activeProfile.id,
        USER_ROLE.ADMIN,
      );
      if (!joinResult.success) {
        throw new Error(joinResult.error || "Erro ao entrar no grupo");
      }

      await loadGroups();
      return newGroup;
    },
    [user, activeProfile, loadGroups],
  );

  const joinGroup = useCallback(
    async (groupId: string) => {
      if (!user || !activeProfile) throw new Error("Precisa estar logado");

      const result = await SocialInteractionsService.joinGroup(
        groupId,
        activeProfile.id,
      );
      if (!result.success)
        throw new Error(result.error || "Erro ao entrar no grupo");

      await GroupService.incrementMembersCount(groupId);
      await loadGroups();
    },
    [user, activeProfile, loadGroups],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user || !activeProfile) throw new Error("Precisa estar logado");

      const result = await SocialInteractionsService.leaveGroup(
        groupId,
        activeProfile.id,
      );
      if (!result.success)
        throw new Error(result.error || "Erro ao sair do grupo");

      await loadGroups();
    },
    [user, activeProfile, loadGroups],
  );

  return {
    groups,
    myGroups,
    loading,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: loadGroups,
  };
}

export function useGroupDetail(groupId: string | undefined) {
  const { user, activeProfile } = useSessionContext();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await GroupService.getGroupById(groupId);
      if (!data) throw new Error("Grupo não encontrado");
      setGroup(data);

      const enrichedMembers = await GroupService.getGroupMembers(groupId);
      setMembers(enrichedMembers);

      if (activeProfile) {
        const membership = enrichedMembers.find(
          (m: any) => m.member_profile_id === activeProfile.id,
        );
        if (membership) {
          setIsMember(true);
          setUserRole(membership?.role || null);
        } else {
          setIsMember(false);
          setUserRole(null);
        }
      }
    } catch (err) {
      logger.error("Error loading group:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, activeProfile]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  return { group, members, isMember, userRole, loading, refetch: loadGroup };
}
