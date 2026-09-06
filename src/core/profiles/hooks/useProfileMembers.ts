/**
 * USE PROFILE MEMBERS - FASE 4
 * Hook para gerenciar membros de um perfil
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { ProfileMembersService } from '../services/multi-profile';
import type { ProfileMember, ProfileRole } from '../services/multi-profile/types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useProfileMembers(profileId: string | null) {
  const [members, setMembers] = useState<ProfileMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!profileId) {
      setMembers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ProfileMembersService.getProfileMembersResult(profileId);

      if (!result.success) {
        setMembers([]);
        setError(result.error || 'Failed to load members');
        return;
      }

      setMembers(result.data ?? []);
    } catch (error: unknown) {
      logger.error('Error loading profile members:', error);
      setMembers([]);
      setError(getErrorMessage(error, 'Failed to load members'));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const addMember = useCallback(async (userId: string, role: ProfileRole = 'member') => {
    if (!profileId) return { success: false, error: 'No profile selected' };

    const result = await ProfileMembersService.addMember(profileId, userId, role);
    
    if (result.success) {
      await loadMembers();
    }

    return result;
  }, [profileId, loadMembers]);

  const inviteMemberByEmail = useCallback(async (email: string, role: ProfileRole = 'member') => {
    if (!profileId) return { success: false, error: 'No profile selected' };

    const result = await ProfileMembersService.inviteMemberByEmail(profileId, email, role);

    if (result.success) {
      await loadMembers();
    }

    return result;
  }, [profileId, loadMembers]);

  const removeMember = useCallback(async (userId: string) => {
    if (!profileId) return { success: false, error: 'No profile selected' };

    const result = await ProfileMembersService.removeMember(profileId, userId);
    
    if (result.success) {
      await loadMembers();
    }

    return result;
  }, [profileId, loadMembers]);

  const updateRole = useCallback(async (userId: string, newRole: ProfileRole) => {
    if (!profileId) return { success: false, error: 'No profile selected' };

    const result = await ProfileMembersService.updateMemberRole(profileId, userId, newRole);
    
    if (result.success) {
      await loadMembers();
    }

    return result;
  }, [profileId, loadMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return {
    members,
    loading,
    error,
    addMember,
    inviteMemberByEmail,
    removeMember,
    updateRole,
    refetch: loadMembers,
  };
}
