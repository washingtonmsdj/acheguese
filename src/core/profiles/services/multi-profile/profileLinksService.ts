/**
 * PROFILE LINKS SERVICE - FASE 3
 * Service layer para gestão de vínculos entre perfis
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProfileLink, LinkType, ServiceResponse } from './types';

export class ProfileLinksService {
  /**
   * Listar links de um perfil (via RLS)
   */
  static async getProfileLinks(profileId: string): Promise<ProfileLink[]> {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select('*')
        .eq('from_profile_id', profileId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []) as ProfileLink[];
    } catch (error: any) {
      console.error('Error fetching profile links:', error);
      return [];
    }
  }

  /**
   * Listar links públicos de um perfil (via view pública)
   */
  static async getPublicProfileLinks(profileId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('public_profile_links')
        .select('*')
        .eq('from_profile_id', profileId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching public profile links:', error);
      return [];
    }
  }

  /**
   * Criar link entre perfis (via RLS)
   */
  static async createLink(
    fromProfileId: string,
    toProfileId: string,
    linkType: LinkType,
    isPublic: boolean = true,
    displayOrder: number = 0
  ): Promise<ServiceResponse<ProfileLink>> {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .insert({
          from_profile_id: fromProfileId,
          to_profile_id: toProfileId,
          link_type: linkType,
          is_public: isPublic,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ProfileLink,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create link',
      };
    }
  }

  /**
   * Atualizar link (via RLS)
   */
  static async updateLink(
    linkId: string,
    updates: Partial<Pick<ProfileLink, 'is_public' | 'display_order'>>
  ): Promise<ServiceResponse<ProfileLink>> {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ProfileLink,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update link',
      };
    }
  }

  /**
   * Deletar link (via RLS)
   */
  static async deleteLink(linkId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('profile_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete link',
      };
    }
  }

  /**
   * Reordenar links (via RLS)
   */
  static async reorderLinks(links: Array<{ id: string; display_order: number }>): Promise<ServiceResponse<void>> {
    try {
      const updates = links.map(link =>
        supabase
          .from('profile_links')
          .update({ display_order: link.display_order })
          .eq('id', link.id)
      );

      await Promise.all(updates);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reorder links',
      };
    }
  }
}
