/**
 * BannerService - SSOT para banners e anúncios
 * 
 * Encapsula acesso ao Supabase para operações de banners.
 * Modules devem usar este service ao invés de acessar integrations diretamente.
 * 
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";

const supabaseTyped = supabase as unknown as AdminSupabaseClient;

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  background_color?: string;
  text_color?: string;
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  priority?: number;
  is_active: boolean;
  starts_at?: string;
  ends_at?: string;
  target_audience?: string[];
  click_count?: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerInput {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  position: Banner['position'];
  priority?: number;
  starts_at?: string;
  ends_at?: string;
  target_audience?: string[];
}

export class BannerService {
  /**
   * Buscar todos os banners ativos
   */
  static async getActiveBanners(position?: Banner['position']): Promise<Banner[]> {
    try {
      let query = supabaseTyped
        .from('banners')
        .select('*')
        .eq('is_active', true);

      if (position) {
        query = query.eq('position', position);
      }

      const { data, error } = await query;

      if (error) {
        // Se a tabela não existe ou há erro de schema/coluna (400/404), retorna array vazio silenciosamente
        if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST204' || error.code === '42703') {
          logger.info('Banners feature not fully configured - skipping');
          return [];
        }
        
        // Para outros erros, log detalhado mas ainda retorna array vazio
        logger.warn('Supabase error fetching banners (non-critical):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }
      
      // Filtrar por data no cliente
      const now = new Date();
      const filtered = (data || []).filter(banner => {
        const startsAt = banner.starts_at ? new Date(banner.starts_at) : null;
        const endsAt = banner.ends_at ? new Date(banner.ends_at) : null;
        
        const hasStarted = !startsAt || startsAt <= now;
        const hasNotEnded = !endsAt || endsAt >= now;
        
        return hasStarted && hasNotEnded;
      });
      
      // Ordenar por priority se existir, senão por created_at
      filtered.sort((a, b) => {
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;
        return priorityB - priorityA;
      });
      
      return filtered;
    } catch (error: any) {
      logger.warn('Error fetching active banners (non-critical):', {
        message: error?.message || 'Unknown error',
        name: error?.name,
        stack: error?.stack
      });
      return [];
    }
  }

  /**
   * Buscar todos os banners (admin)
   */
  static async getAllBanners(): Promise<Banner[]> {
    try {
      const { data, error } = await supabaseTyped
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching all banners:', error);
      return [];
    }
  }

  /**
   * Buscar banner por ID
   */
  static async getBannerById(id: string): Promise<Banner | null> {
    try {
      const { data, error } = await supabaseTyped
        .from('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error fetching banner:', error);
      return null;
    }
  }

  /**
   * Criar novo banner
   */
  static async createBanner(input: CreateBannerInput): Promise<Banner> {
    try {
      const { data, error } = await supabaseTyped
        .from('banners')
        .insert({
          ...input,
          is_active: true,
          priority: input.priority || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error creating banner:', error);
      throw new Error(`Erro ao criar banner: ${error.message}`);
    }
  }

  /**
   * Atualizar banner
   */
  static async updateBanner(
    id: string,
    updates: Partial<CreateBannerInput>
  ): Promise<Banner> {
    try {
      const { data, error } = await supabaseTyped
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error('Error updating banner:', error);
      throw new Error(`Erro ao atualizar banner: ${error.message}`);
    }
  }

  /**
   * Ativar/desativar banner
   */
  static async toggleBannerStatus(id: string, is_active: boolean): Promise<void> {
    try {
      const { error } = await supabaseTyped
        .from('banners')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      logger.error('Error toggling banner status:', error);
      throw new Error(`Erro ao alterar status: ${error.message}`);
    }
  }

  /**
   * Deletar banner
   */
  static async deleteBanner(id: string): Promise<void> {
    try {
      const { error } = await supabaseTyped
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      logger.error('Error deleting banner:', error);
      throw new Error(`Erro ao deletar banner: ${error.message}`);
    }
  }

  /**
   * Incrementar visualizações
   */
  static async incrementViews(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_banner_views', { banner_id: id });
    } catch (error: any) {
      logger.error('Error incrementing banner views:', error);
    }
  }

  /**
   * Incrementar cliques
   */
  static async incrementClicks(id: string): Promise<void> {
    try {
      await supabase.rpc('increment_banner_clicks', { banner_id: id });
    } catch (error: any) {
      logger.error('Error incrementing banner clicks:', error);
    }
  }

  /**
   * Buscar estatísticas de banner
   */
  static async getBannerStats(id: string) {
    try {
      const { data, error } = await supabaseTyped
        .from('banners')
        .select('click_count, view_count')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const ctr = data.view_count > 0 
        ? (data.click_count / data.view_count) * 100 
        : 0;

      return {
        clicks: data.click_count,
        views: data.view_count,
        ctr: Math.round(ctr * 100) / 100
      };
    } catch (error: any) {
      logger.error('Error fetching banner stats:', error);
      return { clicks: 0, views: 0, ctr: 0 };
    }
  }

  /**
   * Buscar banners por posição e audiência
   */
  static async getBannersByAudience(
    position: Banner['position'],
    userTags: string[]
  ): Promise<Banner[]> {
    try {
      const banners = await this.getActiveBanners(position);
      
      // Filtrar por audiência se especificado
      return banners.filter(banner => {
        if (!banner.target_audience || banner.target_audience.length === 0) {
          return true; // Banner para todos
        }
        
        // Verificar se usuário tem alguma tag da audiência alvo
        return banner.target_audience.some(tag => userTags.includes(tag));
      });
    } catch (error: any) {
      logger.error('Error fetching banners by audience:', error);
      return [];
    }
  }

  /**
   * Upload de imagem de banner
   * ✅ SSOT para storage de banners
   */
  static async uploadBannerImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        logger.error('Error uploading banner image:', uploadError);
        throw new Error('Erro ao fazer upload da imagem');
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("banners").getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      logger.error('Error uploading banner image:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
  }
}