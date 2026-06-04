import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  BusinessUrlService,
  type BusinessUrlContext,
} from "@/core/business/services/BusinessUrlService";
import {
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";
import { gastronomyPublicRoutes } from "../routes/gastronomyPublicRoutes";

export class GastronomyUrlService {
  static buildUrls(ctx: BusinessUrlContext) {
    const businessUrls = BusinessUrlService.buildUrls(ctx);

    return {
      canonical: businessUrls.canonical,
      business: businessUrls.canonical,
      dashboard: businessUrls.dashboard,
    };
  }

  static getHomeUrl(): string {
    return gastronomyPublicRoutes.home();
  }

  static getTerritoryUrl(territoryBaseUrl: string): string {
    return buildModuleTerritoryUrl(APP_MODULE_SLUGS.gastronomy, territoryBaseUrl);
  }

  static getLegacyDetailUrlFromTerritory(territoryBaseUrl: string, slug: string): string {
    return buildModuleTerritoryEntityUrl(
      APP_MODULE_SLUGS.gastronomy,
      territoryBaseUrl,
      slug,
    );
  }

  static getCanonicalUrl(ctx: BusinessUrlContext): string {
    return this.buildUrls(ctx).canonical;
  }

  static async getCanonicalUrlWithResolvedCommunityAlias(
    ctx: BusinessUrlContext,
  ): Promise<string> {
    return BusinessUrlService.getCanonicalUrlWithResolvedCommunityAlias(ctx);
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
