/**
 * BusinessUrlService — Camada autorizada SSOT para URLs públicas de empresas.
 *
 * REGRAS ARQUITETURAIS:
 *   - Nenhum componente, hook ou página monta URL de empresa manualmente.
 *   - Toda geração, resolução e validação de URL passa por aqui.
 *   - Hooks apenas consomem este service.
 *
 * PADRÃO OFICIAL DE URLs:
 *   Canônica pública:  /empresas/:uf/:cidade/:slug
 *   Premium (curta):   /p/:slug  → redirect 308 para canônica
 */

import { logger } from '@/shared/utils/logger';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BusinessUrlContext {
  /** profile_id da empresa */
  id: string;
  slug: string;
  is_premium?: boolean;
  /** geographic_path da location associada, ex: /br/ba/salvador/pituba */
  geographic_path: string;
}

export interface ResolvedBusinessUrl {
  /** URL canônica pública: /empresas/ba/salvador/pituba/tonecos-studios */
  canonical: string;
  /** URL premium curta (só para is_premium): /p/tonecos-studios */
  premium: string | null;
  /** URL legado controlado: /business/tonecos-studios */
  legacy: string;
  /** URL interna de dashboard: /dashboard/business/:id */
  dashboard: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Extrai segmentos UF, cidade e bairro de um geographic_path.
 * OBRIGATÓRIO: geographic_path deve ter 4 segmentos (país/estado/cidade/bairro).
 * 
 * Ex: '/br/ba/salvador/pituba' → { uf: 'ba', cidade: 'salvador', bairro: 'pituba' }
 * 
 * Retorna null se não tiver bairro (empresa inválida).
 */
function extractTerritorySegments(
  geoPath: string,
): { uf: string; cidade: string; bairro: string } | null {
  // Remove leading slash e divide
  const parts = geoPath.replace(/^\//, '').split('/');
  // Esperado: [country, state, city, district]
  if (parts.length < 4) {
    logger.error(
      `[BusinessUrlService] geographic_path inválido (sem bairro): "${geoPath}". ` +
      `Empresas devem ter location_id apontando para bairro/district.`
    );
    return null;
  }
  return { uf: parts[1], cidade: parts[2], bairro: parts[3] };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BusinessUrlService {
  /**
   * Gera todas as URLs para uma empresa a partir do contexto mínimo.
   * 
   * OBRIGATÓRIO: geographic_path deve incluir bairro.
   * Empresas sem bairro são inválidas e retornam erro.
   */
  static buildUrls(ctx: BusinessUrlContext): ResolvedBusinessUrl {
    const { id, slug, is_premium, geographic_path } = ctx;

    if (!geographic_path) {
      throw new Error(
        `[BusinessUrlService] Empresa ${id} sem geographic_path. ` +
        `Empresas devem ter location_id apontando para bairro/district.`
      );
    }

    const territory = extractTerritorySegments(geographic_path);
    
    if (!territory) {
      throw new Error(
        `[BusinessUrlService] Empresa ${id} com geographic_path inválido: "${geographic_path}". ` +
        `Esperado formato: /br/:uf/:cidade/:bairro`
      );
    }

    const canonical = `/empresas/${territory.uf}/${territory.cidade}/${territory.bairro}/${slug}`;

    return {
      canonical,
      premium: is_premium ? `/p/${slug}` : null,
      legacy: `/business/${slug}`,
      dashboard: `/dashboard/business/${id}`,
    };
  }

  /**
   * Gera apenas a URL canônica pública.
   * Uso: links em cards, SEO, compartilhamento.
   */
  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  /**
   * Gera a URL premium curta, ou a canônica se não for premium.
   * Uso: botão "compartilhar" para empresas premium.
   */
  static getShareUrl(ctx: BusinessUrlContext): string {
    const urls = this.buildUrls(ctx);
    return urls.premium ?? urls.canonical;
  }

  /**
   * Resolve empresa por slug, retornando o contexto completo de URL.
   * Faz join com locations para obter geographic_path.
   *
   * Retorna null se não encontrada ou inativa.
   */
  static async resolveBySlug(slug: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('business_data')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!location_id(geographic_path)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .in('business_role', ['standalone', 'branch'])
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: data.location?.geographic_path ?? null,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveBySlug error:', err);
      return null;
    }
  }

  /**
   * Resolve empresa por ID (profile_id), retornando o contexto completo de URL.
   * Usado para redirect de rotas legado /business/:uuid.
   */
  static async resolveById(id: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('business_data')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!location_id(geographic_path)
        `)
        .eq('profile_id', id)
        .eq('status', 'active')
        .in('business_role', ['standalone', 'branch'])
        .maybeSingle();

      if (error || !data || !data.slug) return null;

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: data.location?.geographic_path ?? null,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveById error:', err);
      return null;
    }
  }

  /**
   * Resolve empresa por UF + cidade + bairro + slug (rota canônica territorial).
   * Valida que a empresa pertence ao território informado.
   *
   * Retorna null se não encontrada, inativa, ou território não bate.
   */
  static async resolveByTerritoryAndSlug(
    uf: string,
    cidade: string,
    bairro: string,
    slug: string,
  ): Promise<BusinessUrlContext | null> {
    try {
      const expectedPathPrefix = `/br/${uf}/${cidade}/${bairro}`;

      const { data, error } = await (supabase as any)
        .from('business_data')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!location_id(geographic_path)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .in('business_role', ['standalone', 'branch'])
        .maybeSingle();

      if (error || !data) return null;

      const geoPath: string = data.location?.geographic_path ?? '';

      // Valida que o geographic_path bate exatamente com o território esperado
      if (geoPath !== expectedPathPrefix) {
        logger.warn(
          `[BusinessUrlService] Empresa "${slug}" encontrada mas território não bate. ` +
            `Esperado: ${expectedPathPrefix}, Atual: ${geoPath}`,
        );
        return null;
      }

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: geoPath,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveByTerritoryAndSlug error:', err);
      return null;
    }
  }

  /**
   * Valida se um slug pode ser usado como identificador público de empresa.
   * Usa PublicIdentityService para validação consistente.
   */
  static isValidSlug(slug: string): boolean {
    // Valida formato
    const validation = PublicIdentityService.validateFormat(slug, 'business');
    if (!validation.valid) return false;

    // Valida reserved names
    if (PublicIdentityService.isReserved(slug, 'business')) return false;

    return true;
  }

  /**
   * Gera slug a partir de um nome de empresa.
   * Usa PublicIdentityService para normalização consistente.
   */
  static generateSlug(name: string): string {
    return PublicIdentityService.normalize(name, 'business');
  }

  /**
   * Gera slug único verificando disponibilidade via PublicIdentityService.
   * Adiciona sufixo numérico se necessário.
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    const slug = this.generateSlug(name);

    // Verifica disponibilidade via PublicIdentityService
    const availability = await PublicIdentityService.checkAvailability({
      identifier: slug,
      entityType: 'business',
    });

    // Se disponível, retorna
    if (availability.status === 'available') {
      return slug;
    }

    // Se não disponível, usa sugestão
    if (availability.suggestion) {
      return availability.suggestion;
    }

    // Fallback: adiciona contador manualmente
    const { data } = await (supabase as any)
      .from('business_data')
      .select('slug')
      .ilike('slug', `${slug}%`);

    const existingSlugs: string[] = (data || []).map((d: any) => d.slug);
    let counter = 1;
    while (existingSlugs.includes(`${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }

  /**
   * Resolve empresa por URL canônica antiga (slug history).
   * Usado para redirect 308 quando slug ou território mudou.
   *
   * Usa query em dois passos para máxima compatibilidade com PostgREST:
   *   1. Busca profile_id em business_slug_history pela URL antiga
   *   2. Busca contexto atual em business_data pelo profile_id
   *
   * Retorna o contexto atual da empresa (slug e geographic_path atuais),
   * ou null se não houver histórico para esta URL.
   */
  static async resolveBySlugHistory(
    oldCanonicalUrl: string,
  ): Promise<BusinessUrlContext | null> {
    try {
      // Passo 1: buscar profile_id pelo URL canônica antiga
      const { data: histData, error: histErr } = await (supabase as any)
        .from('business_slug_history')
        .select('profile_id')
        .eq('old_canonical_url', oldCanonicalUrl)
        .maybeSingle();

      if (histErr || !histData) return null;

      // Passo 2: buscar contexto atual da empresa
      const { data, error } = await (supabase as any)
        .from('business_data')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!location_id(geographic_path)
        `)
        .eq('profile_id', histData.profile_id)
        .eq('status', 'active')
        .in('business_role', ['standalone', 'branch'])
        .maybeSingle();

      if (error || !data || !data.slug) return null;

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: data.location?.geographic_path ?? null,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveBySlugHistory error:', err);
      return null;
    }
  }
}
