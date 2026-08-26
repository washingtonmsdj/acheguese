import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';

/**
 * BusinessOwnershipService - SSOT de autoridade de gestao de empresas.
 *
 * Contrato canonico:
 * - dono direto do profile (profiles.user_id) pode gerenciar;
 * - membership precisa estar ativa;
 * - somente roles owner/admin podem gerenciar;
 * - member nao possui autoridade de gestao.
 *
 * Esse contrato deve permanecer alinhado a private.can_manage_profile no banco.
 */
export class BusinessOwnershipService {
  static async resolveOwnerProfileId(businessId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('business_data')
        .select('profile_id')
        .eq('id', businessId)
        .maybeSingle();

      if (error) {
        logger.error('[BusinessOwnershipService] Error resolving owner profile:', error);
        return null;
      }

      return data?.profile_id || null;
    } catch (error) {
      logger.error('[BusinessOwnershipService] Unexpected error:', error);
      return null;
    }
  }

  static async isOwner(businessId: string, userId: string): Promise<boolean> {
    try {
      const ownerProfileId = await this.resolveOwnerProfileId(businessId);
      if (!ownerProfileId) {
        logger.warn('[BusinessOwnershipService] No owner profile found for business:', businessId);
        return false;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', ownerProfileId)
        .maybeSingle();

      if (profileError) {
        logger.error('[BusinessOwnershipService] Error checking direct profile owner:', profileError);
        return false;
      }

      if (profile?.user_id === userId) {
        return true;
      }

      const { data: membership, error: membershipError } = await supabase
        .from('profile_members')
        .select('role, is_active')
        .eq('profile_id', ownerProfileId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('role', ['owner', 'admin'])
        .maybeSingle();

      if (membershipError) {
        logger.error('[BusinessOwnershipService] Error checking active membership:', membershipError);
        return false;
      }

      return Boolean(membership?.is_active && ['owner', 'admin'].includes(membership.role));
    } catch (error) {
      logger.error('[BusinessOwnershipService] Unexpected error checking ownership:', error);
      return false;
    }
  }

  static async requireOwnership(businessId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwner(businessId, userId);
    if (!isOwner) {
      throw new Error('Você não tem permissão para realizar esta ação neste negócio');
    }
  }
}
