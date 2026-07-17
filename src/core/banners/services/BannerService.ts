/**
 * BannerService - SSOT para banners e anúncios
 * 
 * Encapsula acesso ao Supabase para operações de banners.
 * Modules devem usar este service ao invés de acessar integrations diretamente.
 * 
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { mediaService } from "@/core/media/services/MediaService";

type QueryError = {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

type QueryArrayResult<T> = {
  data: T[] | null;
  error: QueryError | null;
};

type QuerySingleResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type QueryBuilder<T extends object> = PromiseLike<QueryArrayResult<T>> & {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  insert(values: Record<string, unknown> | Array<Record<string, unknown>>): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  single(): Promise<QuerySingleResult<T>>;
};

type RpcResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type BannerDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<RpcResult<T>>;
};

type BannerStatsRow = { click_count: number | null; view_count: number | null };

const supabaseTyped = supabase as unknown as BannerDbClient;

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
        .from<Banner>('banners')
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
      const filtered = (data || []).filter((banner) => {
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
    } catch (error: unknown) {
      const errorObject = error instanceof Error ? error : null;
      logger.warn('Error fetching active banners (non-critical):', {
        message: errorObject?.message || 'Unknown error',
        name: errorObject?.name,
        stack: errorObject?.stack
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
        .from<Banner>('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
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
        .from<Banner>('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
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
        .from<Banner>('banners')
        .insert({
          ...input,
          is_active: true,
          priority: input.priority || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      logger.error('Error creating banner:', error);
      throw new Error(`Erro ao criar banner: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
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
        .from<Banner>('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: unknown) {
      logger.error('Error updating banner:', error);
      throw new Error(`Erro ao atualizar banner: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }

  /**
   * Ativar/desativar banner
   */
  static async toggleBannerStatus(id: string, is_active: boolean): Promise<void> {
    try {
      const { error } = await supabaseTyped
        .from<Banner>('banners')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('Error toggling banner status:', error);
      throw new Error(`Erro ao alterar status: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }

  /**
   * Deletar banner
   */
  static async deleteBanner(id: string): Promise<void> {
    try {
      const { error } = await supabaseTyped
        .from<Banner>('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('Error deleting banner:', error);
      throw new Error(`Erro ao deletar banner: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }

  /**
   * Incrementar visualizações
   */
  static async incrementViews(id: string): Promise<void> {
    try {
      await supabaseTyped.rpc('increment_banner_views', { banner_id: id });
    } catch (error: unknown) {
      logger.error('Error incrementing banner views:', error);
    }
  }

  /**
   * Incrementar cliques
   */
  static async incrementClicks(id: string): Promise<void> {
    try {
      await supabaseTyped.rpc('increment_banner_clicks', { banner_id: id });
    } catch (error: unknown) {
      logger.error('Error incrementing banner clicks:', error);
    }
  }

  /**
   * Buscar estatísticas de banner
   */
  static async getBannerStats(id: string) {
    try {
      const { data, error } = await supabaseTyped
        .from<BannerStatsRow>('banners')
        .select('click_count, view_count')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const bannerStats = data;
      const ctr = (bannerStats?.view_count || 0) > 0 
        ? ((bannerStats?.click_count || 0) / (bannerStats?.view_count || 0)) * 100 
        : 0;

      return {
        clicks: bannerStats?.click_count || 0,
        views: bannerStats?.view_count || 0,
        ctr: Math.round(ctr * 100) / 100
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error fetching banners by audience:', error);
      return [];
    }
  }

  /**
   * Upload de imagem de banner
   * ✅ SSOT para storage de banners
   */
  static async uploadBannerImage(
    ownerProfileId: string,
    file: File,
  ): Promise<string> {
    try {
      const upload = await mediaService.uploadMediaAsset(
        ownerProfileId,
        file,
        "site_banner",
      );
      return upload.reference;
    } catch (error: unknown) {
      logger.error('Error uploading banner image:', error);
      throw new Error(`Erro ao fazer upload: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    }
  }
}
