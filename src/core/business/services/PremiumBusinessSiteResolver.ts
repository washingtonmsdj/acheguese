import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

export interface PremiumBusinessTerritoryRoute {
  readonly state: string;
  readonly city: string;
  readonly district: string;
  readonly businessSlug: string;
}

export interface PremiumBusinessSiteResolution {
  readonly premiumSlug: string;
  readonly profileId: string;
  readonly canonicalBusinessUrl: string;
  readonly territoryRoute: PremiumBusinessTerritoryRoute;
}

export interface PremiumBusinessSiteRoutes {
  readonly home: string;
  readonly menu: string;
  readonly cart: string;
  readonly checkout: string;
  product: (productSlug: string) => string;
}

function parseTerritoryPath(geographicPath: string): Omit<PremiumBusinessTerritoryRoute, "businessSlug"> | null {
  const parts = geographicPath.split("/").filter(Boolean);
  if (parts.length < 4) {
    return null;
  }

  return {
    state: parts[1],
    city: parts[2],
    district: parts[3],
  };
}

export class PremiumBusinessSiteResolver {
  static async resolve(slug: string): Promise<PremiumBusinessSiteResolution | null> {
    const explicitPremiumContext = await BusinessUrlService.resolveByPremiumSlug(slug);
    const context =
      explicitPremiumContext ??
      (await BusinessUrlService.resolveBySlug(slug));

    if (!context?.is_premium) {
      return null;
    }

    const territory = parseTerritoryPath(context.geographic_path);
    if (!territory) {
      return null;
    }

    return {
      premiumSlug: slug,
      profileId: context.id,
      canonicalBusinessUrl: BusinessUrlService.getCanonicalUrl(context),
      territoryRoute: {
        ...territory,
        businessSlug: context.slug,
      },
    };
  }

  static buildRoutes(premiumSlug: string): PremiumBusinessSiteRoutes {
    const base = `/p/${premiumSlug}`;
    return {
      home: base,
      menu: `${base}/cardapio`,
      cart: `${base}/carrinho`,
      checkout: `${base}/checkout`,
      product: (productSlug: string) => `${base}/produto/${productSlug}`,
    };
  }
}

