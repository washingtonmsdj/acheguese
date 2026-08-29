/**
 * PROFILE MEMBERS SERVICE - FASE 3
 * Service layer para gestão de membros de perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import { ProfileRpcService } from '../ProfileRpcService';
import type { ProfileMember, ProfileRole, ServiceResponse } from './types';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export class ProfileMembersService {
  /**
   * Listar membros de um perfil (via RLS)
   */
  static async getProfileMembers(profileId: string): Promise<ProfileMember[]> {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .select('*')
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []) as ProfileMember[];
    } catch (error: unknown) {
      logger.error('Error fetching profile members:', error);
      return [];
    }
  }

  /**
   * Adicionar membro a um perfil (via RLS)
   */
  static async addMember(
    profileId: string,
    userId: string,
    role: ProfileRole = 'member'
  ): Promise<ServiceResponse<ProfileMember>> {
    try {
      const currentUser = await SessionService.getCurrentUser();
      
      const { data, error } = await supabase
        .from('profile_members')
        .insert({
          profile_id: profileId,
          user_id: userId,
          role,
          invited_by: currentUser?.id,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ProfileMember,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to add member'),
      };
    }
  }

  /**
   * Convida membro por email usando RPC transacional
   */
  static async inviteMemberByEmail(
    profileId: string,
    email: string,
    role: ProfileRole = 'member',
  ): Promise<ServiceResponse<{ success: boolean; message?: string }>> {
    try {
      const result = await ProfileRpcService.inviteMemberByEmail<{
        success?: boolean;
        error?: string;
        message?: string;
      }>(profileId, email.trim(), role);
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to invite member',
        };
      }

      return {
        success: true,
        data: {
          success: true,
          message: result.message,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to invite member'),
      };
    }
  }

  /**
   * Remover membro de um perfil (via RLS)
   */
  static async removeMember(profileId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('profile_members')
        .delete()
        .eq('profile_id', profileId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to remove member'),
      };
    }
  }

  /**
   * Atualizar role de um membro (via RLS)
   */
  static async updateMemberRole(
    profileId: string,
    userId: string,
    newRole: ProfileRole
  ): Promise<ServiceResponse<ProfileMember>> {
    try {
      const { data, error } = await supabase
        .from('profile_members')
        .update({ role: newRole })
        .eq('profile_id', profileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ProfileMember,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to update member role'),
      };
    }
  }

  /**
   * Resolve a role operacional ativa preservando erro de infraestrutura para
   * consumidores que precisam distinguir "sem membership" de "consulta falhou".
   */
  static async getActiveRoleResult(
    profileId: string,
    userId?: string,
  ): Promise<ServiceResponse<ProfileRole | null>> {
    try {
      let targetUserId = userId;

      if (!targetUserId) {
        const currentUser = await SessionService.getCurrentUser();
        if (!currentUser) {
          return { success: true, data: null };
        }
        targetUserId = currentUser.id;
      }

      const { data, error } = await supabase
        .from('profile_members')
        .select('role')
        .eq('profile_id', profileId)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      const role = data?.role as ProfileRole | undefined;
      return {
        success: true,
        data:
          role === 'owner' || role === 'admin' || role === 'member'
            ? role
            : null,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to resolve active profile membership role'),
      };
    }
  }

  /**
   * Resolve a role operacional ativa de um membro.
   *
   * Invariante de autoridade: memberships inativas não concedem gestão.
   * Mantém o runtime alinhado a private.can_manage_profile no banco.
   */
  static async getActiveRole(
    profileId: string,
    userId?: string,
  ): Promise<ProfileRole | null> {
    const result = await this.getActiveRoleResult(profileId, userId);
    if (!result.success) {
      logger.error('Error resolving active profile membership role:', result.error);
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Verificar se usuário é owner ativo de um perfil.
   */
  static async isOwner(profileId: string, userId?: string): Promise<boolean> {
    return (await this.getActiveRole(profileId, userId)) === 'owner';
  }

  /**
   * Verificar se usuário é owner/admin ativo de um perfil.
   */
  static async isManager(profileId: string, userId?: string): Promise<boolean> {
    const role = await this.getActiveRole(profileId, userId);
    return role === 'owner' || role === 'admin';
  }
}

