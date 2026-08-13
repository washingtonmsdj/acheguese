import type { Page, Route } from "@playwright/test";

const CREATED_AT = "2026-08-01T12:00:00.000Z";

export const HOME_TERRITORIES = {
  city: {
    id: "10000000-0000-4000-8000-000000000001",
    parent_id: null,
    type: "city",
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, Bahia",
    geographic_path: "/br/ba/salvador",
    status: "active",
    metadata: {
      is_selector_active: true,
      is_landing_enabled: true,
      is_navigable: true,
      state_code: "BA",
    },
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
  pituba: {
    id: "10000000-0000-4000-8000-000000000002",
    parent_id: "10000000-0000-4000-8000-000000000001",
    type: "district",
    slug: "pituba",
    name: "Pituba",
    full_name: "Pituba, Salvador, Bahia",
    geographic_path: "/br/ba/salvador/pituba",
    status: "active",
    metadata: {
      is_selector_active: true,
      is_landing_enabled: true,
      is_navigable: true,
      state_code: "BA",
    },
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
  valeria: {
    id: "10000000-0000-4000-8000-000000000003",
    parent_id: "10000000-0000-4000-8000-000000000001",
    type: "district",
    slug: "valeria",
    name: "Valéria",
    full_name: "Valéria, Salvador, Bahia",
    geographic_path: "/br/ba/salvador/valeria",
    status: "active",
    metadata: {
      is_selector_active: true,
      is_landing_enabled: true,
      is_navigable: true,
      state_code: "BA",
    },
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
} as const;

type TerritoryRow = (typeof HOME_TERRITORIES)[keyof typeof HOME_TERRITORIES];

const ALL_TERRITORIES: readonly TerritoryRow[] =
  Object.values(HOME_TERRITORIES);

function valueWithoutOperator(value: string | null): string | null {
  if (!value) return null;
  const separatorIndex = value.indexOf(".");
  return separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value;
}

function valuesFromInFilter(value: string | null): string[] {
  const raw = valueWithoutOperator(value);
  if (!raw) return [];
  return raw.replace(/^\(/, "").replace(/\)$/, "").split(",").filter(Boolean);
}

function locationRowsForRequest(url: URL): TerritoryRow[] {
  const geographicPath = valueWithoutOperator(
    url.searchParams.get("geographic_path"),
  );
  if (geographicPath) {
    return ALL_TERRITORIES.filter(
      (row) => row.geographic_path === geographicPath,
    );
  }

  const id = valueWithoutOperator(url.searchParams.get("id"));
  if (id && !id.startsWith("(")) {
    return ALL_TERRITORIES.filter((row) => row.id === id);
  }

  const ids = valuesFromInFilter(url.searchParams.get("id"));
  if (ids.length > 0) {
    return ALL_TERRITORIES.filter((row) => ids.includes(row.id));
  }

  const slug = valueWithoutOperator(url.searchParams.get("slug"));
  const parentId = valueWithoutOperator(url.searchParams.get("parent_id"));
  if (slug && parentId) {
    return ALL_TERRITORIES.filter(
      (row) => row.slug === slug && row.parent_id === parentId,
    );
  }

  const parentIds = valuesFromInFilter(url.searchParams.get("parent_id"));
  if (parentIds.length > 0) {
    return ALL_TERRITORIES.filter(
      (row) => row.parent_id !== null && parentIds.includes(row.parent_id),
    );
  }

  if (parentId) {
    return ALL_TERRITORIES.filter((row) => row.parent_id === parentId);
  }

  const orFilter = url.searchParams.get("or") ?? "";
  if (orFilter.includes(HOME_TERRITORIES.pituba.geographic_path)) {
    return [HOME_TERRITORIES.pituba];
  }
  if (orFilter.includes(HOME_TERRITORIES.valeria.geographic_path)) {
    return [HOME_TERRITORIES.valeria];
  }
  if (orFilter.includes(HOME_TERRITORIES.city.geographic_path)) {
    return [...ALL_TERRITORIES];
  }

  return [...ALL_TERRITORIES];
}

function requestTargetsPituba(url: URL): boolean {
  return decodeURIComponent(url.search).includes(HOME_TERRITORIES.pituba.id);
}

function fixtureRows(table: string, url: URL): unknown[] {
  if (table === "locations") return locationRowsForRequest(url);

  if (table === "business_data") {
    const select = url.searchParams.get("select") ?? "";
    if (!requestTargetsPituba(url) || !select.includes("owner_profile"))
      return [];
    return [
      {
        id: "20000000-0000-4000-8000-000000000001",
        profile_id: "30000000-0000-4000-8000-000000000001",
        business_name: "Oficina Horizonte",
        category: "Serviços automotivos",
        metadata: {},
        rating: 4.8,
        is_premium: false,
        is_verified: true,
        slug: "oficina-horizonte",
        location_id: HOME_TERRITORIES.pituba.id,
        status: "active",
        created_at: CREATED_AT,
        location: { geographic_path: HOME_TERRITORIES.pituba.geographic_path },
        owner_profile: {
          display_name: "Oficina Horizonte",
          name: "Oficina Horizonte",
          username: "oficina_horizonte",
        },
      },
    ];
  }

  return [];
}

async function fulfillPostgrest(route: Route, rows: unknown[]): Promise<void> {
  const request = route.request();
  const acceptsSingle = (request.headers().accept ?? "").includes(
    "application/vnd.pgrst.object+json",
  );
  const body = acceptsSingle ? (rows[0] ?? null) : rows;
  const rangeEnd = Math.max(0, rows.length - 1);

  await route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    headers: {
      "access-control-allow-origin": "*",
      "content-range": rows.length > 0 ? `0-${rangeEnd}/${rows.length}` : "*/0",
    },
    body: request.method() === "HEAD" ? undefined : JSON.stringify(body),
  });
}

/**
 * Backend read fixture for public Home tests.
 *
 * It intercepts only browser requests made by the test. Application code keeps
 * using the real repositories and policies; Production never receives fixture
 * data and the suite performs no database mutation.
 */
export async function installTerritoryHomeFixtures(page: Page): Promise<void> {
  await page.route(/\/rest\/v1\/([^?]+)/, async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/rest/v1/")[1]?.split("/")[0] ?? "";
    await fulfillPostgrest(route, fixtureRows(table, url));
  });

  await page.route(/\/rest\/v1\/rpc\/.*/, async (route) => {
    await fulfillPostgrest(route, []);
  });
}
