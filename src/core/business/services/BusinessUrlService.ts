/**
 * BusinessUrlService - SSOT autorizado para URLs publicas de empresas.
 *
 * Regras arquiteturais:
 *   - Nenhum componente, hook ou pagina monta URL de empresa manualmente.
 *   - Toda geracao, resolucao e validacao de URL passa por aqui.
 *   - Hooks apenas consomem este service.
 *
 * Padrao publico canonico:
 *   /:state/:city/:territorySlug/empresas/:slug
 *
 * Premium isolado:
 *   /p/:slug
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import { PublicIdentityService } from '@/core/public-identity';
import { buildPublicEntityUrl } from '@/core/routing/policies';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { buildBusinessPremiumUrl } from '@/core/business/utils/businessPublicUrls';

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
  /** URL publica canonica: /:state/:city/:territorySlug/empresas/:slug. */
  canonical: string;
  /** URL premium curta (so para is_premium): /p/tonecos-studios */
  premium: string | null;

  /** URL interna de gestao: /central/empresas/:id */
  dashboard: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const BUSINESS_TERRITORY_SEGMENT_COUNT = 3;

function normalizeBusinessTerritoryPath(ctx: BusinessUrlContext): string {
  const { id, geographic_path } = ctx;

  if (!geographic_path) {
    throw new Error(
      `[BusinessUrlService] Empresa ${id} sem geographic_path. ` +
        `Empresas devem ter location_id apontando para bairro/district.`,
    );
  }

  let normalizedPath: string;
  try {
    normalizedPath = normalizePublicTerritoryPath(geographic_path);
  } catch {
    throw new Error(
      `[BusinessUrlService] Empresa ${id} com geographic_path inválido: "${geographic_path}". ` +
        `Esperado formato: /br/:uf/:cidade/:bairro`,
    );
  }

  const territorySegments = normalizedPath.split('/').filter(Boolean);
  if (territorySegments.length !== BUSINESS_TERRITORY_SEGMENT_COUNT) {
    logger.error(
      `[BusinessUrlService] geographic_path inválido: "${geographic_path}". ` +
        `Empresas devem apontar exatamente para um território /:uf/:cidade/:bairro.`,
    );
    throw new Error(
      `[BusinessUrlService] Empresa ${id} com geographic_path inválido: "${geographic_path}". ` +
        `Esperado formato: /br/:uf/:cidade/:bairro`,
    );
  }

  return normalizedPath;
}

function buildCanonicalBusinessUrl(ctx: BusinessUrlContext): string {
  return buildPublicEntityUrl({
    module: APP_MODULE_SLUGS.business,
    geographicPath: normalizeBusinessTerritoryPath(ctx),
    slug: ctx.slug,
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BusinessUrlService {
  /**
   * Gera todas as URLs para uma empresa a partir do contexto mínimo.
   *
   * OBRIGATÓRIO: geographic_path deve apontar exatamente para um território
   * público /:uf/:cidade/:bairro.
   *
   * @param ctx - Contexto da empresa
   */
  static buildUrls(ctx: BusinessUrlContext): ResolvedBusinessUrl {
    const { id, slug, is_premium } = ctx;
    const canonical = buildCanonicalBusinessUrl(ctx);
    const dashboard = businessManagementRoutes.overview(id);

    return {
      canonical,
      premium: is_premium ? buildBusinessPremiumUrl(slug) : null,
      dashboard,
    };
  }

  /**
   * Gera apenas a URL canônica pública.
   * Uso: links em cards, SEO, compartilhamento.
   */
  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return buildCanonicalBusinessUrl(ctx);
  }

  /**
   * Nome explicito para consumidores novos.
   * A entidade publica pertence ao territorio; Comunidade nao altera sua URL.
   */
  static getPublicCanonicalUrl(ctx: BusinessUrlContext): string {
    return buildCanonicalBusinessUrl(ctx);
  }

  /**
   * Gera a URL premium curta, ou a canônica se não for premium.
   * Uso: botão "compartilhar" para empresas premium.
   *
   * IMPORTANTE: is_premium deve vir de entitlement resolvido, não de flag isolada.
   * Para uso correto, consultar EntitlementResolver.hasShortPremiumLink()
   */
  static getShareUrl(ctx: BusinessUrlContext): string {
    const urls = this.buildUrls(ctx);
    return urls.premium ?? urls.canonical;
  }

  /**
   * Gera a URL de compartilhamento baseada em entitlement.
   * Versão SSOT que consulta o resolver de entitlements.
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
   * Retorna null se não encontrada ou inativa.
   */
  static async resolveBySlug(slug: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from('public_business_search')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!public_business_search_location_id_fkey(geographic_path)
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
   * Prioriza o mapeamento explícito de assinantes elegíveis.
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
   * Usado por componentes internos que recebem apenas o identificador da empresa.
   */
  static async resolveById(id: string): Promise<BusinessUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from('public_business_search')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!public_business_search_location_id_fkey(geographic_path)
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
   * Resolve empresa por UF + cidade + território da URL + slug.
   * A empresa continua validada contra sua localização geográfica canônica.
   *
   * Retorna null se não encontrada, inativa, ou território não bate.
   */
  static async resolveByTerritoryAndSlug(
    uf: string,
    cidade: string,
    territorySlug: string,
    slug: string,
  ): Promise<BusinessUrlContext | null> {
    try {
      const expectedPathPrefix = `/br/${uf}/${cidade}/${territorySlug}`;

      const { data, error } = await supabase
        .from('public_business_search')
        .select(`
          profile_id,
          slug,
          is_premium,
          location:locations!public_business_search_location_id_fkey(geographic_path)
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
   * Gera slug único pela autoridade transversal de identidade pública.
   */
  static async generateUniqueSlug(name: string): Promise<string> {
    return PublicIdentityService.generateAvailableIdentifier({
      name,
      entityType: 'business',
    });
  }
}
