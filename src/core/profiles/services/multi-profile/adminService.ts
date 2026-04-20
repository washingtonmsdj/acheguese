/**
 * ADMIN SERVICE - FASE 7
 * Service para operações administrativas em perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 * 
 * REGRAS:
 * - Chamadas via edge functions (não RPCs diretas)
 * - Edge functions validam admin_users
 * - Edge functions chamam RPCs via service_role
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import type { ServiceResponse } from './types';
export class AdminService {
  /**
   * Verificar perfil (via edge function)
   */
  static async verifyProfile(profileId: string, reason?: string): Promise<ServiceResponse<{ profile_id: string }>> {
    try {
      const user = await SessionService.getCurrentUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const accessToken = SessionService.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: 'No session token available',
        };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-verify-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to verify profile',
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify profile',
      };
    }
  }

  /**
   * Suspender perfil (via edge function)
   */
  static async suspendProfile(profileId: string, reason: string): Promise<ServiceResponse<{ profile_id: string }>> {
    try {
      if (!reason || reason.trim() === '') {
        return {
          success: false,
          error: 'Reason is required for suspension',
        };
      }

      const user = await SessionService.getCurrentUser();
      
      if (!user) {
        return {
          success: false,
          error: 'Not authenticated',
        };
      }

      const accessToken = SessionService.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          error: 'No session token available',
        };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-suspend-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to suspend profile',
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to suspend profile',
      };
    }
  }

  /**
   * Verificar se usuário atual é admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      
      if (!user) return false;

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Buscar audit log de um perfil
   */
  static async getProfileAuditLog(profileId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profile_audit_log')
        .select('*')
        .eq('profile_id', profileId)
        .order('performed_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      logger.error('Error fetching audit log:', error);
      return [];
    }
  }
}

