import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { OpeningHoursService } from "@/core/business/services/OpeningHoursService";
import type {
  GastronomyBusiness,
  GastronomyBusinessFilters,
  Menu,
  MenuPromotion,
  MenuWithCategories,
  PublicGastronomyFoodItem,
} from "../types";
import { getMockMenuForBusiness, getMockPromotions } from "../__mocks__/gastronomyDetailMocks";
import { MOCK_FOOD_ITEMS } from "../__mocks__/foodItemMocks";
import { MOCK_GASTRONOMY_BUSINESSES } from "../__mocks__/gastronomyMocks";

function normalizeGeoPath(path?: string | null): string {
  if (!path) return "";
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const compact = withLeadingSlash.replace(/\/{2,}/g, "/");
  const withCountry = compact.startsWith("/br/") || compact === "/br" ? compact : `/br${compact}`;
  return withCountry.length > 1 && withCountry.endsWith("/")
    ? withCountry.slice(0, -1)
    : withCountry;
}

function isPathInsideTerritory(path: string, territoryPaths: string[]): boolean {
  if (!territoryPaths.length) return false;
  const normalizedPath = normalizeGeoPath(path);

  return territoryPaths.some((territoryPath) => {
    const normalizedTerritoryPath = normalizeGeoPath(territoryPath);
    return (
      normalizedPath === normalizedTerritoryPath ||
      normalizedPath.startsWith(`${normalizedTerritoryPath}/`)
    );
  });
}

function normalizeSearch(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export function isGastronomyDevMockEnabled(): boolean {
  if (!import.meta.env.DEV) return false;

  const rawFlag = String(import.meta.env.VITE_ENABLE_GASTRONOMY_DEV_MOCKS ?? "true")
    .trim()
    .toLowerCase();

  return !["0", "false", "off", "no"].includes(rawFlag);
}

export function getTerritoryGeoPaths(resolved?: ResolvedTerritory | null): string[] {
  if (!resolved) return [];

  if (resolved.kind === "location") {
    return [normalizeGeoPath(resolved.location.geographic_path)].filter(Boolean);
  }

  return resolved.group.members
    .map((member) => normalizeGeoPath(member.geographic_path))
    .filter(Boolean);
}

export function getMockBusinessesForTerritory(params: {
  territoryGeoPaths: string[];
  filters?: GastronomyBusinessFilters;
  searchQuery?: string;
}): GastronomyBusiness[] {
  const { territoryGeoPaths, filters = {}, searchQuery } = params;
  const normalizedSearch = normalizeSearch(searchQuery || filters.search);

  let businesses = MOCK_GASTRONOMY_BUSINESSES.filter((business) =>
    isPathInsideTerritory(business.geographic_path, territoryGeoPaths),
  );

  if (filters.cuisine_type) {
    businesses = businesses.filter(
      (business) => business.gastronomy_profile.cuisine_type === filters.cuisine_type,
    );
  }

  if (filters.price_range) {
    businesses = businesses.filter(
      (business) => business.gastronomy_profile.price_range === filters.price_range,
    );
  }

  if (filters.delivery_enabled !== undefined) {
    businesses = businesses.filter(
      (business) => business.gastronomy_profile.delivery_enabled === filters.delivery_enabled,
    );
  }

  if (filters.takeout_enabled !== undefined) {
    businesses = businesses.filter(
      (business) => business.gastronomy_profile.takeout_enabled === filters.takeout_enabled,
    );
  }

  if (filters.dine_in_enabled !== undefined) {
    businesses = businesses.filter(
      (business) => business.gastronomy_profile.dine_in_enabled === filters.dine_in_enabled,
    );
  }

  if (filters.is_open_now) {
    businesses = businesses.filter((business) => {
      if (!business.horario_funcionamento) return true;
      return OpeningHoursService.calculateStatus(
        business.horario_funcionamento,
      ).is_open;
    });
  }

  if (normalizedSearch) {
    businesses = businesses.filter((business) => {
      const haystack = [
        business.name,
        business.description,
        business.gastronomy_profile.cuisine_type,
        business.location?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }

  return businesses;
}

export function getMockFoodCatalogForTerritory(params: {
  territoryGeoPaths: string[];
  searchQuery?: string;
  cuisineType?: string;
  deliveryEnabled?: boolean;
  isOpenNow?: boolean;
}): PublicGastronomyFoodItem[] {
  const { territoryGeoPaths, searchQuery, cuisineType, deliveryEnabled, isOpenNow } = params;
  const normalizedSearch = normalizeSearch(searchQuery);
  const businessCoordinatesMap = new Map(
    MOCK_GASTRONOMY_BUSINESSES.map((business) => [
      business.business_data_id,
      {
        latitude:
          typeof business.address?.latitude === 'number' ? business.address.latitude : undefined,
        longitude:
          typeof business.address?.longitude === 'number' ? business.address.longitude : undefined,
      },
    ]),
  );

  const items = MOCK_FOOD_ITEMS.filter((item) => {
    if (!isPathInsideTerritory(item.business_geographic_path, territoryGeoPaths)) {
      return false;
    }

    if (cuisineType && item.business_cuisine !== cuisineType) {
      return false;
    }

    if (deliveryEnabled !== undefined && item.business_delivery_enabled !== deliveryEnabled) {
      return false;
    }

    if (isOpenNow && !item.business_is_open) {
      return false;
    }

    if (normalizedSearch) {
      const haystack = [
        item.name,
        item.description,
        item.category,
        item.business_name,
        item.business_cuisine,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    return true;
  });

  return items.map((item) => ({
    id: item.id,
    business_data_id: item.business_data_id,
    business_profile_id: `mock-profile-${item.business_data_id}`,
    menu_id: `mock-menu-${item.business_data_id}`,
    category_id: `mock-category-${item.business_data_id}-${item.category}`,
    name: item.name,
    description: item.description,
    price: item.price,
    original_price: item.original_price,
    image_url: item.image_url,
    category: item.category,
    tags: item.tags,
    business_name: item.business_name,
    business_slug: item.business_slug,
    business_cuisine: item.business_cuisine,
    business_rating: item.business_rating,
    business_neighborhood: item.business_neighborhood,
    business_geographic_path: normalizeGeoPath(item.business_geographic_path),
    business_latitude:
      businessCoordinatesMap.get(item.business_data_id)?.latitude,
    business_longitude:
      businessCoordinatesMap.get(item.business_data_id)?.longitude,
    business_is_open: item.business_is_open,
    business_delivery_enabled: item.business_delivery_enabled,
    business_takeout_enabled: item.business_takeout_enabled,
    business_delivery_time_min: item.business_delivery_time_min,
    business_delivery_time_max: item.business_delivery_time_max,
    business_delivery_fee: item.business_delivery_fee,
    is_featured: item.is_featured,
    is_promotion: item.is_promotion,
    is_vegetarian: item.is_vegetarian,
    is_vegan: item.is_vegan,
    is_spicy: item.is_spicy,
    is_gluten_free: item.is_gluten_free,
    orders_count: item.orders_count,
  }));
}

export function getMockBusinessByIdentifier(identifier: string): GastronomyBusiness | null {
  if (!identifier) return null;

  return (
    MOCK_GASTRONOMY_BUSINESSES.find(
      (business) =>
        business.business_data_id === identifier ||
        business.id === identifier ||
        business.slug === identifier,
    ) ?? null
  );
}

export function getMockBusinessByTerritoryAndSlug(params: {
  state: string;
  city: string;
  district: string;
  slug: string;
}): GastronomyBusiness | null {
  const expectedPath = normalizeGeoPath(`/br/${params.state}/${params.city}/${params.district}`);

  return (
    MOCK_GASTRONOMY_BUSINESSES.find(
      (business) =>
        business.slug === params.slug &&
        normalizeGeoPath(business.geographic_path) === expectedPath,
    ) ?? null
  );
}

export function getMockMenusByBusinessId(businessId: string): Menu[] {
  const business = getMockBusinessByIdentifier(businessId);
  if (!business) return [];

  const menu = getMockMenuForBusiness(business.business_data_id);
  return [
    {
      id: menu.id,
      business_id: menu.business_id,
      name: menu.name,
      description: menu.description,
      is_active: menu.is_active,
      display_order: menu.display_order,
      available_days: menu.available_days,
      available_start_time: menu.available_start_time,
      available_end_time: menu.available_end_time,
      created_at: menu.created_at,
      updated_at: menu.updated_at,
    },
  ];
}

export function getMockMenuById(menuId: string): MenuWithCategories | null {
  if (!menuId?.startsWith("mock-menu-")) {
    return null;
  }

  const businessId = menuId.replace("mock-menu-", "");
  const business = getMockBusinessByIdentifier(businessId);
  if (!business) return null;

  return getMockMenuForBusiness(business.business_data_id);
}

export function getMockPromotionsByBusinessId(businessId: string): MenuPromotion[] {
  const business = getMockBusinessByIdentifier(businessId);
  if (!business) return [];

  return getMockPromotions(business.business_data_id);
}
