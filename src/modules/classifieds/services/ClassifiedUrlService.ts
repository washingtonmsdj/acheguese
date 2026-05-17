/**
 * ClassifiedUrlService — SSOT para URLs públicas de classificados
 *
 * REGRAS ARQUITETURAIS:
 *   - Nenhum componente monta URL de classificado manualmente
 *   - Toda geração, resolução e validação passa por aqui
 *   - Hooks apenas consomem este service
 *
 * PADRÃO OFICIAL DE URLs:
 *   Canônica: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId
 *   Curta:    /c/:publicId
 *
 * REGRAS OBRIGATÓRIAS:
 *   - Classificado pertence a um bairro (location_id → district)
 *   - category_id e subcategory_id obrigatórios
 *   - slug derivado do título, pode mudar
 *   - public_id estável, nunca muda
 *   - Resolução sempre por public_id
 *
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase/supabase';
import { getAllClassifieds } from '@/modules/classifieds/services/classifieds.queries';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ClassifiedUrlContext {
  id: string;
  public_id: string;
  slug: string;
  /** geographic_path da location, ex: /br/ba/salvador/pituba */
  geographic_path: string;
  /** slug da categoria */
  category_slug: string;
  /** slug da subcategoria */
  subcategory_slug: string;
}

export interface ResolvedClassifiedUrl {
  /** URL canônica: /classificados/ba/salvador/pituba/moveis/guarda-roupas/armario-cozinha/ab12cd34 */
  canonical: string;
  /** URL curta: /c/ab12cd34 */
  short: string;
  /** URL interna de edição: /classificados/editar/:id */
  edit: string;
}

export interface ClassifiedResolution {
  id: string;
  public_id: string;
  current_canonical: string;
  needs_redirect: boolean;
  redirect_to?: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Extrai segmentos UF, cidade e bairro de um geographic_path.
 * OBRIGATÓRIO: geographic_path deve ter 4 segmentos (país/estado/cidade/bairro).
 */
function extractTerritorySegments(
  geoPath: string,
): { uf: string; cidade: string; bairro: string } | null {
  const parts = geoPath.replace(/^\//, '').split('/');
  if (parts.length < 4) {
    logger.error(
      `[ClassifiedUrlService] geographic_path inválido (sem bairro): "${geoPath}"`
    );
    return null;
  }
  return { uf: parts[1], cidade: parts[2], bairro: parts[3] };
}

/**
 * Normaliza string para slug URL-safe.
 * Remove acentos, caracteres especiais, converte para lowercase.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços → hífens
    .replace(/-+/g, '-') // Múltiplos hífens → único
    .replace(/^-|-$/g, ''); // Remove hífens nas pontas
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ClassifiedUrlService {
  /**
   * Gera URL curta canônica para classificado.
   */
  static buildShortUrl(publicId: string): string {
    const normalized = String(publicId ?? '').trim();
    if (!normalized) {
      throw new Error('[ClassifiedUrlService] publicId inválido para URL curta');
    }
    return `/c/${normalized}`;
  }

  /**
   * Gera todas as URLs para um classificado a partir do contexto.
   */
  static buildUrls(ctx: ClassifiedUrlContext): ResolvedClassifiedUrl {
    const { id, public_id, slug, geographic_path, category_slug, subcategory_slug } = ctx;

    if (!geographic_path) {
      throw new Error(
        `[ClassifiedUrlService] Classificado ${id} sem geographic_path`
      );
    }

    const territory = extractTerritorySegments(geographic_path);
    
    if (!territory) {
      throw new Error(
        `[ClassifiedUrlService] Classificado ${id} com geographic_path inválido: "${geographic_path}"`
      );
    }

    const { uf, cidade, bairro } = territory;

    const canonical = `/classificados/${uf}/${cidade}/${bairro}/${category_slug}/${subcategory_slug}/${slug}/${public_id}`;
    const short = this.buildShortUrl(public_id);
    const edit = `/classificados/editar/${id}`;

    return { canonical, short, edit };
  }

  /**
   * Resolve um classificado por public_id.
   * Retorna URL canônica atual e indica se precisa redirect.
   */
  static async resolveByPublicId(publicId: string): Promise<ClassifiedResolution | null> {
    try {
      const classifieds = await getAllClassifieds({ scope: 'none' });
      const data = classifieds.find((item) => item.public_id === publicId);
      if (!data) {
        logger.warn(`[ClassifiedUrlService] Classificado não encontrado: ${publicId}`);
        return null;
      }
      if (!data.geographic_path || !data.category_slug || !data.subcategory_slug) {
        logger.error(`[ClassifiedUrlService] Dados incompletos para ${publicId}`);
        return null;
      }

      const urls = this.buildUrls({
        id: data.id,
        public_id: data.public_id,
        slug: data.slug,
        geographic_path: data.geographic_path,
        category_slug: data.category_slug,
        subcategory_slug: data.subcategory_slug,
      });

      return {
        id: data.id,
        public_id: data.public_id,
        current_canonical: urls.canonical,
        needs_redirect: false,
      };
    } catch (error) {
      logger.error('[ClassifiedUrlService] Erro ao resolver public_id:', error);
      return null;
    }
  }

  /**
   * Resolve um classificado pela URL canônica completa.
   * Detecta se a URL está desatualizada e retorna redirect.
   */
  static async resolveByCanonicalUrl(
    uf: string,
    cidade: string,
    bairro: string,
    categoriaSlug: string,
    subcategoriaSlug: string,
    slug: string,
    publicId: string
  ): Promise<ClassifiedResolution | null> {
    const requestedUrl = `/classificados/${uf}/${cidade}/${bairro}/${categoriaSlug}/${subcategoriaSlug}/${slug}/${publicId}`;

    // Resolve pelo public_id (âncora estável)
    const resolution = await this.resolveByPublicId(publicId);
    
    if (!resolution) {
      // Tenta buscar no histórico
      return await this.resolveFromHistory(requestedUrl);
    }

    // Verifica se URL atual difere da solicitada
    if (resolution.current_canonical !== requestedUrl) {
      return {
        ...resolution,
        needs_redirect: true,
        redirect_to: resolution.current_canonical,
      };
    }

    return resolution;
  }

  /**
   * Busca URL antiga no histórico e retorna redirect para canonical atual.
   */
  private static async resolveFromHistory(oldUrl: string): Promise<ClassifiedResolution | null> {
    try {
      const { data, error } = await supabase
        .from('classified_url_history')
        .select('classified_id')
        .eq('old_canonical_url', oldUrl)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // Busca classificado atual
      const classifieds = await getAllClassifieds({ scope: 'none' });
      const classified = classifieds.find((item) => item.id === data.classified_id);
      if (!classified || !classified.geographic_path || !classified.category_slug || !classified.subcategory_slug) {
        return null;
      }

      const urls = this.buildUrls({
        id: classified.id,
        public_id: classified.public_id,
        slug: classified.slug,
        geographic_path: classified.geographic_path,
        category_slug: classified.category_slug,
        subcategory_slug: classified.subcategory_slug,
      });

      return {
        id: classified.id,
        public_id: classified.public_id,
        current_canonical: urls.canonical,
        needs_redirect: true,
        redirect_to: urls.canonical,
      };
    } catch (error) {
      logger.error('[ClassifiedUrlService] Erro ao buscar histórico:', error);
      return null;
    }
  }

  /**
   * Gera slug a partir do título.
   */
  static generateSlug(title: string): string {
    return slugify(title);
  }

  /**
   * Busca contexto completo de um classificado para gerar URLs.
   */
  static async getUrlContext(classifiedId: string): Promise<ClassifiedUrlContext | null> {
    try {
      const classifieds = await getAllClassifieds({ scope: 'none' });
      const data = classifieds.find((item) => item.id === classifiedId);
      if (!data) {
        return null;
      }
      if (!data.geographic_path || !data.category_slug || !data.subcategory_slug) {
        return null;
      }

      return {
        id: data.id,
        public_id: data.public_id,
        slug: data.slug,
        geographic_path: data.geographic_path,
        category_slug: data.category_slug,
        subcategory_slug: data.subcategory_slug,
      };
    } catch (error) {
      logger.error('[ClassifiedUrlService] Erro ao buscar contexto:', error);
      return null;
    }
  }
}

export const classifiedUrlService = ClassifiedUrlService;

