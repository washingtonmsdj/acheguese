import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";
import {
  GroupService,
  type Group,
  type GroupMemberDetail,
} from "@/core/social/services/GroupService";

export type { Group };

export function useGroupDetail(groupId: string | undefined) {
  const { activeProfile } = useSessionContext();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMemberDetail[]>([]);
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
          (m) => m.member_profile_id === activeProfile.id,
        );
        if (membership) {
          setIsMember(true);
          setUserRole(membership?.role || null);
        } else {
          setIsMember(false);
          setUserRole(null);
        }
      }
    } catch (err: unknown) {
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
