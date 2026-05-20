/**
 * BusinessUrlService â€” Camada autorizada SSOT para URLs pÃºblicas de empresas.
 *
 * REGRAS ARQUITETURAIS:
 *   - Nenhum componente, hook ou pÃ¡gina monta URL de empresa manualmente.
 *   - Toda geraÃ§Ã£o, resoluÃ§Ã£o e validaÃ§Ã£o de URL passa por aqui.
 *   - Hooks apenas consomem este service.
 *
 * PADRÃƒO OFICIAL DE URLs:
 *   CanÃ´nica pÃºblica:  /empresas/:uf/:cidade/:slug
 *   Premium (curta):   /p/:slug  â†’ mini-site premium isolado
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

// â”€â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface BusinessUrlContext {
  /** profile_id da empresa */
  id: string;
  slug: string;
  is_premium?: boolean;
  /** geographic_path da location associada, ex: /br/ba/salvador/pituba */
  geographic_path: string;
}


export interface ResolvedBusinessUrl {
  /** URL canÃ´nica pÃºblica: /empresas/ba/salvador/pituba/tonecos-studios */
  canonical: string;
  /** URL premium curta (sÃ³ para is_premium): /p/tonecos-studios */
  premium: string | null;

  /** URL interna de gestao: /central/empresas/:id */
  dashboard: string;
}

// â”€â”€â”€ Helpers internos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Extrai segmentos UF, cidade e bairro de um geographic_path.
 * OBRIGATÃ“RIO: geographic_path deve ter 4 segmentos (paÃ­s/estado/cidade/bairro).
 *
 * Ex: '/br/ba/salvador/pituba' â†’ { uf: 'ba', cidade: 'salvador', bairro: 'pituba' }
 *
 * Retorna null se nÃ£o tiver bairro (empresa invÃ¡lida).
 */
function extractTerritorySegments(
  geoPath: string,
): { uf: string; cidade: string; bairro: string } | null {
  // Remove leading slash e divide
  const parts = geoPath.replace(/^\//, '').split('/');
  // Esperado: [country, state, city, district]
  if (parts.length < 4) {
    logger.error(
      `[BusinessUrlService] geographic_path invÃ¡lido (sem bairro): "${geoPath}". ` +
      `Empresas devem ter location_id apontando para bairro/district.`
    );
    return null;
  }
  return { uf: parts[1], cidade: parts[2], bairro: parts[3] };
}

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class BusinessUrlService {
  /**
   * Gera todas as URLs para uma empresa a partir do contexto mÃ­nimo.
   *
   * OBRIGATÃ“RIO: geographic_path deve incluir bairro.
   * Empresas sem bairro sÃ£o invÃ¡lidas e retornam erro.
   *
   * @param ctx - Contexto da empresa
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
        `[BusinessUrlService] Empresa ${id} com geographic_path invÃ¡lido: "${geographic_path}". ` +
        `Esperado formato: /br/:uf/:cidade/:bairro`
      );
    }

    const canonical = `/empresas/${territory.uf}/${territory.cidade}/${territory.bairro}/${slug}`;
    const dashboard = businessManagementRoutes.overview(id);

    return {
      canonical,
      premium: is_premium ? `/p/${slug}` : null,

      dashboard,
    };
  }

  /**
   * Gera apenas a URL canÃ´nica pÃºblica.
   * Uso: links em cards, SEO, compartilhamento.
   */
  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  /**
   * Gera a URL premium curta, ou a canÃ´nica se nÃ£o for premium.
   * Uso: botÃ£o "compartilhar" para empresas premium.
   *
   * IMPORTANTE: is_premium deve vir de entitlement resolvido, nÃ£o de flag isolada.
   * Para uso correto, consultar EntitlementResolver.hasShortPremiumLink()
   */
  static getShareUrl(ctx: BusinessUrlContext): string {
    const urls = this.buildUrls(ctx);
    return urls.premium ?? urls.canonical;
  }

  /**
   * Gera a URL de compartilhamento baseada em entitlement.
   * VersÃ£o SSOT que consulta o resolver de entitlements.
   *
   * @param ctx - Contexto da empresa
   * @param hasShortLinkEntitlement - Resultado de EntitlementResolver.hasShortPremiumLink()
   */
  static getShareUrlByEntitlement(
    ctx: BusinessUrlContext,
    hasShortLinkEntitlement: boolean
  ): string {
    const urls = this.buildUrls(ctx);
    return hasShortLinkEntitlement ? (urls.premium ?? urls.canonical) : urls.canonical;
  }

  /**
   * Resolve empresa por slug, retornando o contexto completo de URL.
   * Faz join com locations para obter geographic_path.
   *
   * Retorna null se nÃ£o encontrada ou inativa.
   */
  static async resolveBySlug(slug: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await supabase
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
      const geographicPath = data.location?.geographic_path;
      if (!geographicPath) return null;

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: geographicPath,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveBySlug error:', err);
      return null;
    }
  }

  /**
   * Resolve empresa por slug curto premium (/p/:slug) usando business_premium_links.
   * Prioriza o mapeamento explÃ­cito de assinantes elegÃ­veis.
   */
  static async resolveByPremiumSlug(slug: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from("business_premium_links")
        .select(`
          slug,
          business:business_data!business_id(
            profile_id,
            slug,
            is_premium,
            status,
            business_role,
            location:locations!location_id(geographic_path)
          )
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data || !data.business) {
        return null;
      }

      const business = data.business as {
        profile_id?: string;
        slug?: string;
        is_premium?: boolean;
        status?: string;
        business_role?: string;
        location?: { geographic_path?: string | null } | null;
      };

      if (
        !business.profile_id ||
        !business.slug ||
        !business.is_premium ||
        business.status !== "active" ||
        !["standalone", "branch"].includes(business.business_role ?? "")
      ) {
        return null;
      }

      const geographicPath = business.location?.geographic_path;
      if (!geographicPath) {
        return null;
      }

      return {
        id: business.profile_id,
        slug: business.slug,
        is_premium: true,
        geographic_path: geographicPath,
      };
    } catch (err) {
      logger.error("[BusinessUrlService] resolveByPremiumSlug error:", err);
      return null;
    }
  }

  /**
   * Resolve empresa por ID (profile_id), retornando o contexto completo de URL.
   * Usado para redirect de rotas legado /business/:uuid.
   */
  static async resolveById(id: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await supabase
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
      const geographicPath = data.location?.geographic_path;
      if (!geographicPath) return null;

      return {
        id: data.profile_id,
        slug: data.slug,
        is_premium: data.is_premium,
        geographic_path: geographicPath,
      };
    } catch (err) {
      logger.error('[BusinessUrlService] resolveById error:', err);
      return null;
    }
  }

  /**
   * Resolve empresa por UF + cidade + bairro + slug (rota canÃ´nica territorial).
   * Valida que a empresa pertence ao territÃ³rio informado.
   *
   * Retorna null se nÃ£o encontrada, inativa, ou territÃ³rio nÃ£o bate.
   */
  static async resolveByTerritoryAndSlug(
    uf: string,
    cidade: string,
    bairro: string,
    slug: string,
  ): Promise<BusinessUrlContext | null> {
    try {
      const expectedPathPrefix = `/br/${uf}/${cidade}/${bairro}`;

      const { data, error } = await supabase
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

      // Valida que o geographic_path bate exatamente com o territÃ³rio esperado
      if (geoPath !== expectedPathPrefix) {
        logger.warn(
          `[BusinessUrlService] Empresa "${slug}" encontrada mas territÃ³rio nÃ£o bate. ` +
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
   * Valida se um slug pode ser usado como identificador pÃºblico de empresa.
   * Usa PublicIdentityService para validaÃ§Ã£o consistente.
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
   * Usa PublicIdentityService para normalizaÃ§Ã£o consistente.
   */
  static generateSlug(name: string): string {
    return PublicIdentityService.normalize(name, 'business');
  }

  /**
   * Gera slug Ãºnico verificando disponibilidade via PublicIdentityService.
   * Adiciona sufixo numÃ©rico se necessÃ¡rio.
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    const slug = this.generateSlug(name);

    // Verifica disponibilidade via PublicIdentityService
    const availability = await PublicIdentityService.checkAvailability({
      identifier: slug,
      entityType: 'business',
    });

    // Se disponÃ­vel, retorna
    if (availability.status === 'available') {
      return slug;
    }

    // Se nÃ£o disponÃ­vel, usa sugestÃ£o
    if (availability.suggestion) {
      return availability.suggestion;
    }

    // Fallback: adiciona contador manualmente
    const { data } = await supabase
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

}
