import { logger } from '@/shared/utils/logger';
/**
 * BusinessOwnershipService - SSOT para verificação de ownership de negócios
 * 
 * REGRAS:
 * - Centraliza lógica de verificação de ownership
 * - Resolve profile_id do business
 * - Verifica se usuário é owner/admin via profile_members
 * 
 * @version 1.0.0
 */

export class BusinessOwnershipService {
  /**
   * Resolve o profile_id do owner de um business
   * @param businessId - ID do business (business_data.id)
   * @returns profile_id do owner ou null
   */
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
   * Verifica se um usuário é owner ou admin de um business
   * @param businessId - ID do business (business_data.id)
   * @param userId - ID do usuário
   * @returns true se o usuário é owner/admin
   */
  static async isOwner(businessId: string, userId: string): Promise<boolean> {
    try {
      const ownerProfileId = await this.resolveOwnerProfileId(businessId);
      if (!ownerProfileId) {
        logger.warn('[BusinessOwnershipService] No owner profile found for business:', businessId);
        return false;
      }

      const { data, error } = await supabase
        .from('profile_members')
        .select('role')
        .eq('profile_id', ownerProfileId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('[BusinessOwnershipService] Error checking ownership:', error);
        return false;
      }

      if (!data) {
        return false;
      }

      return ['owner', 'admin'].includes(data.role);
    } catch (error) {
      logger.error('[BusinessOwnershipService] Unexpected error checking ownership:', error);
      return false;
    }
  }

  /**
   * Verifica ownership e lança erro se não for owner
   * @param businessId - ID do business
   * @param userId - ID do usuário
   * @throws Error se não for owner
   */
  static async requireOwnership(businessId: string, userId: string): Promise<void> {
    const isOwner = await this.isOwner(businessId, userId);
    if (!isOwner) {
      throw new Error('Você não tem permissão para realizar esta ação neste negócio');
    }
  }
}
