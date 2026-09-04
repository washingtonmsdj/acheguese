import type { Page, Route } from "@playwright/test";

const CREATED_AT = "2026-09-04T12:00:00.000Z";

export const E2E_BUSINESS = {
  slug: "e2e-oficina-horizonte",
  name: "Oficina Horizonte E2E",
  communityAlias: "e2e-complexo",
  publicPath: "/empresas/ba/salvador/e2e-complexo/e2e-oficina-horizonte",
  communityPath: "/comunidade/e2e-complexo/empresas/e2e-oficina-horizonte",
} as const;

const IDS = {
  city: "91000000-0000-4000-8000-000000000001",
  district: "91000000-0000-4000-8000-000000000002",
  group: "92000000-0000-4000-8000-000000000001",
  community: "93000000-0000-4000-8000-000000000001",
  businessData: "94000000-0000-4000-8000-000000000001",
  profile: "95000000-0000-4000-8000-000000000001",
} as const;

const geographicPath = "/br/ba/salvador/e2e-complexo";

const city = {
  id: IDS.city,
  parent_id: null,
  type: "city",
  slug: "salvador",
  name: "Salvador",
  full_name: "Salvador, Bahia",
  geographic_path: "/br/ba/salvador",
  status: "active",
  metadata: { is_navigable: true, is_landing_enabled: true },
  created_at: CREATED_AT,
  updated_at: CREATED_AT,
};

const district = {
  id: IDS.district,
  parent_id: IDS.city,
  type: "district",
  slug: E2E_BUSINESS.communityAlias,
  name: "Complexo E2E",
  full_name: "Complexo E2E, Salvador, Bahia",
  geographic_path: geographicPath,
  status: "active",
  metadata: { is_navigable: true, is_landing_enabled: true },
  created_at: CREATED_AT,
  updated_at: CREATED_AT,
};

const group = {
  id: IDS.group,
  slug: E2E_BUSINESS.communityAlias,
  name: "Complexo E2E",
  description: "Fixture tecnica de rota publica.",
  anchor_city_id: IDS.city,
  status: "active",
  metadata: { is_navigable: true },
  created_at: CREATED_AT,
  updated_at: CREATED_AT,
};

const community = {
  id: IDS.community,
  name: "Achegue-se Complexo E2E",
  slug: E2E_BUSINESS.communityAlias,
  city_id: IDS.city,
  territory_type: "territorial_group",
  territory_id: IDS.group,
  status: "active",
  headline: null,
  description: null,
  launch_message: null,
  hero_title: null,
  hero_subtitle: null,
  primary_cta_label: null,
  secondary_cta_label: null,
  is_featured: false,
  sort_order: 0,
};

const businessUrlRow = {
  id: IDS.businessData,
  profile_id: IDS.profile,
  slug: E2E_BUSINESS.slug,
  is_premium: false,
  status: "active",
  business_role: "standalone",
  location_id: IDS.district,
  location: { geographic_path: geographicPath },
};

const snapshot = {
  identity: {
    profileId: IDS.profile,
    businessId: IDS.businessData,
    slug: E2E_BUSINESS.slug,
    displayName: E2E_BUSINESS.name,
    canonicalBusinessUrl: E2E_BUSINESS.publicPath,
  },
  institutional: {
    name: E2E_BUSINESS.name,
    description: "Empresa tecnica usada apenas por Playwright.",
    category: "servicos",
    subcategory: "Oficina",
    logoUrl: null,
    bannerUrl: null,
    photos: [],
    addressText: "Rua Fixture, 100",
    locationText: "Complexo E2E, Salvador - BA",
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    openStatus: { open: true, todayHours: "08:00 - 18:00" },
    openingHours: {},
    rating: 4.8,
    reviewCount: 12,
    business: {
      id: IDS.profile,
      business_data_id: IDS.businessData,
      profile_id: IDS.profile,
      name: E2E_BUSINESS.name,
      business_name: E2E_BUSINESS.name,
      slug: E2E_BUSINESS.slug,
      description: "Empresa tecnica usada apenas por Playwright.",
      category: "servicos",
      subcategoria: "Oficina",
      status: "active",
      business_role: "standalone",
      location_id: IDS.district,
      geographic_path: geographicPath,
      location: {
        id: IDS.district,
        name: "Complexo E2E",
        full_name: "Complexo E2E, Salvador - BA",
        geographic_path: geographicPath,
      },
      rating: 4.8,
      total_reviews: 12,
      is_verified: true,
      is_premium: false,
      created_at: "2024-01-01T12:00:00.000Z",
      updated_at: CREATED_AT,
    },
  },
  verticals: {
    activeVerticals: [],
    primaryVertical: null,
    canonicalVerticalUrl: null,
    verticalPublicUrls: {},
  },
  gastronomyPreview: [],
  seo: {
    title: `${E2E_BUSINESS.name} | Achegue-se`,
    description: "Empresa tecnica usada apenas por Playwright.",
    canonical: E2E_BUSINESS.publicPath,
    robots: "index, follow",
    schemaType: "LocalBusiness",
    hasLocalBusinessSchema: true,
    hasRestaurantSchema: false,
  },
  routing: {},
};

function decodedSearch(url: URL): string {
  return decodeURIComponent(url.search);
}

function targets(url: URL, value: string): boolean {
  return decodedSearch(url).includes(value);
}

async function fulfillRows(route: Route, rows: unknown[]): Promise<void> {
  const request = route.request();
  const acceptsSingle = (request.headers().accept ?? "").includes(
    "application/vnd.pgrst.object+json",
  );
  await route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    headers: {
      "access-control-allow-origin": "*",
      "content-range": rows.length ? `0-${rows.length - 1}/${rows.length}` : "*/0",
    },
    body: request.method() === "HEAD"
      ? undefined
      : JSON.stringify(acceptsSingle ? (rows[0] ?? null) : rows),
  });
}

export async function installBusinessRouteFixtures(page: Page): Promise<void> {
  await page.route(/\/rest\/v1\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.includes("/rest/v1/rpc/get_public_business_snapshot_by_slug")) {
      let body: Record<string, unknown> = {};
      try {
        body = request.postDataJSON() as Record<string, unknown>;
      } catch {
        body = {};
      }

      if (body.p_slug === E2E_BUSINESS.slug) {
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(snapshot),
        });
        return;
      }

      await route.continue();
      return;
    }

    const table = pathname.split("/rest/v1/")[1]?.split("/")[0] ?? "";
    const search = decodedSearch(url);

    if (
      table === "territory_communities" &&
      (search.includes(E2E_BUSINESS.communityAlias) ||
        search.includes(IDS.community) ||
        search.includes(IDS.group))
    ) {
      await fulfillRows(route, [community]);
      return;
    }

    if (
      table === "community_public_aliases" &&
      (search.includes(E2E_BUSINESS.communityAlias) ||
        search.includes(IDS.community))
    ) {
      await fulfillRows(route, [
        {
          alias: E2E_BUSINESS.communityAlias,
          territory_community_id: IDS.community,
          status: "active",
        },
      ]);
      return;
    }

    if (table === "territorial_groups" && targets(url, IDS.group)) {
      await fulfillRows(route, [group]);
      return;
    }

    if (table === "territorial_group_members" && targets(url, IDS.group)) {
      await fulfillRows(route, []);
      return;
    }

    if (table === "locations") {
      if (targets(url, IDS.city) || targets(url, city.geographic_path)) {
        await fulfillRows(route, [city]);
        return;
      }
      if (targets(url, IDS.district) || targets(url, geographicPath)) {
        await fulfillRows(route, [district]);
        return;
      }
    }

    if (
      table === "business_data" &&
      (search.includes(E2E_BUSINESS.slug) ||
        search.includes(IDS.profile) ||
        search.includes(IDS.businessData))
    ) {
      await fulfillRows(route, [businessUrlRow]);
      return;
    }

    await route.continue();
  });
}
