import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { profileService } from '@/core/profiles/services/ProfileService';
import { ProfileMembersService } from '@/core/profiles/services/multi-profile/profileMembersService';

/**
 * BusinessOwnershipService - SSOT de autoridade de gestao de empresas.
 *
 * Contrato canonico:
 * - dono direto do profile (profiles.user_id) pode gerenciar, lido via ProfileService;
 * - membership precisa estar ativa;
 * - somente roles owner/admin podem gerenciar;
 * - member nao possui autoridade de gestao.
 *
 * Esse contrato deve permanecer alinhado a private.can_manage_profile no banco.
 */
export type BusinessManagementRole = 'owner' | 'admin';

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

  /**
   * Resolve a autoridade operacional real do ator.
   *
   * - owner: somente o proprietario estrutural de profiles.user_id;
   * - admin: Gestor ativo em profile_members;
   * - null: sem autoridade de gestao.
   */
  static async resolveManagementRole(
    businessId: string,
    userId: string,
  ): Promise<BusinessManagementRole | null> {
    try {
      const ownerProfileId = await this.resolveOwnerProfileId(businessId);
      if (!ownerProfileId) {
        logger.warn('[BusinessOwnershipService] No owner profile found for business:', businessId);
        return null;
      }

      const profile = await profileService.getProfileById(ownerProfileId);
      if (profile?.user_id === userId) {
        return 'owner';
      }

      const activeRole = await ProfileMembersService.getActiveRole(
        ownerProfileId,
        userId,
      );

      return activeRole === 'admin' ? 'admin' : null;
    } catch (error) {
      logger.error(
        '[BusinessOwnershipService] Unexpected error resolving management role:',
        error,
      );
      return null;
    }
  }

  /**
   * Compatibilidade historica: este metodo responde "pode gerenciar",
   * portanto inclui Proprietario e Gestor.
   */
  static async isOwner(businessId: string, userId: string): Promise<boolean> {
    return (await this.resolveManagementRole(businessId, userId)) !== null;
  }

  static async isDirectOwner(
    businessId: string,
    userId: string,
  ): Promise<boolean> {
    return (await this.resolveManagementRole(businessId, userId)) === 'owner';
  }

  static async requireOwnership(businessId: string, userId: string): Promise<void> {
    const canManage = await this.isOwner(businessId, userId);
    if (!canManage) {
      throw new Error('Você não tem permissão para realizar esta ação neste negócio');
    }
  }
}
