/**
 * PROFILE MEMBERS SERVICE - FASE 3
 * Service layer para gestão de membros de perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { supabase } from '@/integrations/supabase/client';
import { SessionService } from '@/core/session/services/SessionService';
import type { ProfileMember, ProfileRole, ServiceResponse } from './types';

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
    } catch (error: any) {
      console.error('Error fetching profile members:', error);
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add member',
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
      const { data, error } = await supabase.rpc('invite_profile_member_by_email', {
        p_profile_id: profileId,
        p_email: email.trim(),
        p_role: role,
      });

      if (error) throw error;

      const result = (data || {}) as { success?: boolean; error?: string; message?: string };
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to invite member',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove member',
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
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update member role',
      };
    }
  }

  /**
   * Verificar se usuário é owner/admin de um perfil
   */
  static async isManager(profileId: string, userId?: string): Promise<boolean> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const currentUser = await SessionService.getCurrentUser();
        if (!currentUser) return false;
        targetUserId = currentUser.id;
      }

      const { data, error } = await supabase
        .from('profile_members')
        .select('role')
        .eq('profile_id', profileId)
        .eq('user_id', targetUserId)
        .in('role', ['owner', 'admin'])
        .single();

      if (error) return false;

      return !!data;
    } catch (error: any) {
      return false;
    }
  }
}
