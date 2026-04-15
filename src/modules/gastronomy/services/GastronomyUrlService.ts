/**
 * GastronomyUrlService - URLs canônicas de gastronomia
 * 
 * REUTILIZA BusinessUrlService - mesma identidade, mesmo slug, mesmo território
 * Apenas adapta o módulo na URL
 */

import { BusinessUrlService, type BusinessUrlContext } from '@/core/business/services/BusinessUrlService';

export class GastronomyUrlService {
  /**
   * Gera URLs de gastronomia a partir do contexto de negócio
   * Reutiliza BusinessUrlService e adapta módulo
   */
  static buildUrls(ctx: BusinessUrlContext) {
    const businessUrls = BusinessUrlService.buildUrls(ctx);
    
    // Substituir /empresas por /gastronomia
    const canonical = businessUrls.canonical.replace('/empresas/', '/gastronomia/');
    
    return {
      canonical,
      business: businessUrls.canonical, // URL da página institucional
      dashboard: businessUrls.dashboard,
    };
  }

  /**
   * Gera URL canônica de gastronomia
   */
  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  /**
   * Resolve negócio gastronômico por slug
   * Reutiliza BusinessUrlService
   */
  static async resolveBySlug(slug: string): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveBySlug(slug);
  }

  /**
   * Resolve negócio gastronômico por território + slug
   * Reutiliza BusinessUrlService
   */
  static async resolveByTerritoryAndSlug(
    uf: string,
    cidade: string,
    bairro: string,
    slug: string,
  ): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveByTerritoryAndSlug(uf, cidade, bairro, slug);
  }

  /**
   * Resolve negócio gastronômico por ID
   * Reutiliza BusinessUrlService
   */
  static async resolveById(id: string): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveById(id);
  }
}
