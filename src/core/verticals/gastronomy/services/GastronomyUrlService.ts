import {
  BusinessUrlService,
  type BusinessUrlContext,
} from "@/core/business/services/BusinessUrlService";

export class GastronomyUrlService {
  static buildUrls(ctx: BusinessUrlContext) {
    const businessUrls = BusinessUrlService.buildUrls(ctx);
    const canonical = businessUrls.canonical.replace("/empresas/", "/gastronomia/");

    return {
      canonical,
      business: businessUrls.canonical,
      dashboard: businessUrls.dashboard,
    };
  }

  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  static async resolveBySlug(slug: string): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveBySlug(slug);
  }

  static async resolveByTerritoryAndSlug(
    uf: string,
    cidade: string,
    bairro: string,
    slug: string,
  ): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveByTerritoryAndSlug(uf, cidade, bairro, slug);
  }

  static async resolveById(id: string): Promise<BusinessUrlContext | null> {
    return BusinessUrlService.resolveById(id);
  }
}

