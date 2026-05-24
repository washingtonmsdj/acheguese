/**
 * ProfessionalUrlService — Camada autorizada SSOT para URLs públicas de profissionais.
 *
 * REGRAS ARQUITETURAIS:
 *   - Nenhum componente, hook ou página monta URL de profissional manualmente.
 *   - Toda geração, resolução e validação de URL passa por aqui.
 *   - Hooks apenas consomem este service.
 *
 * PADRÃO OFICIAL DE URLs:
 *   Canônica pública:  /profissionais/:uf/:cidade/:slug
 *   
 * DIFERENÇAS COM BUSINESS:
 *   - Professional não requer bairro (apenas cidade)
 *   - Professional não tem link premium curto
 *   - Professional não tem geographic_path (usa location_id)
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { PublicIdentityService } from '@/core/public-identity/services/PublicIdentityService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProfessionalUrlContext {
  /** profile_id do profissional */
  id: string;
  slug: string;
  /** Estado (UF) - ex: 'ba', 'sp' */
  state: string;
  /** Cidade - ex: 'salvador', 'sao-paulo' */
  city: string;
}

export interface ResolvedProfessionalUrl {
  /** URL canônica pública: /profissionais/ba/salvador/joao-silva-dev */
  canonical: string;
  /** URL interna de dashboard: /dashboard/professional/:id */
  dashboard: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Normaliza UF e cidade para URL
 * Remove acentos, converte para lowercase, substitui espaços por hífens
 */
function normalizeForUrl(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços para hífens
    .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ProfessionalUrlService {
  /**
   * Gera todas as URLs para um profissional a partir do contexto mínimo.
   */
  static buildUrls(ctx: ProfessionalUrlContext): ResolvedProfessionalUrl {
    const { id, slug, state, city } = ctx;

    if (!state || !city) {
      throw new Error(
        `[ProfessionalUrlService] Profissional ${id} sem state/city. ` +
        `Profissionais devem ter location_id apontando para cidade.`
      );
    }

    const normalizedState = normalizeForUrl(state);
    const normalizedCity = normalizeForUrl(city);
    const canonical = `/profissionais/${normalizedState}/${normalizedCity}/${slug}`;

    return {
      canonical,
      dashboard: `/dashboard/professional/${id}`,
    };
  }

  /**
   * Gera apenas a URL canônica pública.
   * Uso: links em cards, SEO, compartilhamento.
   */
  static getCanonicalUrl(ctx: ProfessionalUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  /**
   * Resolve profissional por slug + UF + cidade, retornando o contexto completo de URL.
   * Faz join com locations para obter state e city.
   *
   * Retorna null se não encontrado ou inativo.
   */
  static async resolveBySlug(
    slug: string,
    state: string,
    city: string,
  ): Promise<ProfessionalUrlContext | null> {
    try {
      const normalizedState = normalizeForUrl(state);
      const normalizedCity = normalizeForUrl(city);

      const { data, error } = await supabase
        .from('professional_data')
        .select(`
          profile_id,
          slug,
          location:locations!location_id(
            id,
            name,
            type,
            parent:locations!parent_id(
              id,
              name,
              type,
              parent:locations!parent_id(
                id,
                name,
                type
              )
            )
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        logger.warn('[ProfessionalUrlService] Professional not found', { slug, state, city, error });
        return null;
      }

      // Extrair state e city da hierarquia de locations
      const location = data.location as any;
      if (!location) {
        logger.warn('[ProfessionalUrlService] Professional without location', { slug });
        return null;
      }

      // Determinar state e city baseado no tipo de location
      let extractedState = '';
      let extractedCity = '';

      if ((location.type === 'neighborhood' || location.type === 'district')) {
        // location é bairro → parent é cidade → parent.parent é estado
        extractedCity = location.parent?.name || '';
        extractedState = location.parent?.parent?.name || '';
      } else if (location.type === 'city') {
        // location é cidade → parent é estado
        extractedCity = location.name;
        extractedState = location.parent?.name || '';
      } else if (location.type === 'state') {
        // location é estado (inválido para professional)
        logger.warn('[ProfessionalUrlService] Professional with state-level location', { slug });
        return null;
      }

      // Validar que state e city batem com os parâmetros
      const extractedStateNormalized = normalizeForUrl(extractedState);
      const extractedCityNormalized = normalizeForUrl(extractedCity);

      if (extractedStateNormalized !== normalizedState || extractedCityNormalized !== normalizedCity) {
        logger.warn(
          '[ProfessionalUrlService] Professional found but location mismatch',
          {
            slug,
            expected: { state: normalizedState, city: normalizedCity },
            actual: { state: extractedStateNormalized, city: extractedCityNormalized },
          }
        );
        return null;
      }

      return {
        id: data.profile_id,
        slug: data.slug,
        state: extractedState,
        city: extractedCity,
      };
    } catch (err) {
      logger.error('[ProfessionalUrlService] resolveBySlug error:', err);
      return null;
    }
  }

  /**
   * Resolve profissional por ID (profile_id), retornando o contexto completo de URL.
   * Usado por componentes internos que recebem apenas o identificador do perfil.
   */
  static async resolveById(id: string): Promise<ProfessionalUrlContext | null> {
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .select(`
          profile_id,
          slug,
          location:locations!location_id(
            id,
            name,
            type,
            parent:locations!parent_id(
              id,
              name,
              type,
              parent:locations!parent_id(
                id,
                name,
                type
              )
            )
          )
        `)
        .eq('profile_id', id)
        .maybeSingle();

      if (error || !data || !data.slug) {
        logger.warn('[ProfessionalUrlService] Professional not found by id', { id, error });
        return null;
      }

      // Extrair state e city da hierarquia de locations
      const location = data.location as any;
      if (!location) {
        logger.warn('[ProfessionalUrlService] Professional without location', { id });
        return null;
      }

      let state = '';
      let city = '';

      if ((location.type === 'neighborhood' || location.type === 'district')) {
        city = location.parent?.name || '';
        state = location.parent?.parent?.name || '';
      } else if (location.type === 'city') {
        city = location.name;
        state = location.parent?.name || '';
      }

      if (!state || !city) {
        logger.warn('[ProfessionalUrlService] Could not extract state/city', { id, location });
        return null;
      }

      return {
        id: data.profile_id,
        slug: data.slug,
        state,
        city,
      };
    } catch (err) {
      logger.error('[ProfessionalUrlService] resolveById error:', err);
      return null;
    }
  }

  /**
   * Valida se um slug pode ser usado como identificador público de profissional.
   * Usa PublicIdentityService para validação consistente.
   */
  static isValidSlug(slug: string): boolean {
    // Valida formato
    const validation = PublicIdentityService.validateFormat(slug, 'professional');
    if (!validation.valid) return false;

    // Valida reserved names
    if (PublicIdentityService.isReserved(slug, 'professional')) return false;

    return true;
  }

  /**
   * Gera slug a partir de um nome de profissional.
   * Usa PublicIdentityService para normalização consistente.
   */
  static generateSlug(name: string): string {
    return PublicIdentityService.normalize(name, 'professional');
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
      entityType: 'professional',
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
    const { data } = await supabase
      .from('professional_data')
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
