import {
  LocationStatus,
  LocationType,
  TERRITORIAL_GROUP_STATUS,
  type Location,
  type TerritorialGroupWithMembers,
} from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

type FallbackInput = {
  state?: string | null;
  city?: string | null;
  territorySlug?: string | null;
};

const FALLBACK_TIMESTAMP = "2026-01-01T00:00:00.000Z";
const PUBLIC_FALLBACK_FLAG = "public_fallback";
const FALLBACK_BOUNDARY_RINGS_KEY = "fallback_boundary_rings";

function normalizeSegment(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const salvadorLocation: Location = {
  id: "fallback-location-salvador",
  parent_id: "fallback-location-ba",
  type: LocationType.CITY,
  slug: "salvador",
  name: "Salvador",
  full_name: "Salvador, BA",
  geographic_path: "/br/ba/salvador",
  status: LocationStatus.ACTIVE,
  metadata: {
    state_code: "BA",
    timezone: "America/Bahia",
    center_latitude: -12.9714,
    center_longitude: -38.5014,
    [PUBLIC_FALLBACK_FLAG]: true,
  },
  created_at: FALLBACK_TIMESTAMP,
  updated_at: FALLBACK_TIMESTAMP,
};

const nordesteDeAmaralinaBoundaryRing: [number, number][] = [
  [-13.0102057813107, -38.468414921628],
  [-13.0115226680028, -38.4691783378043],
  [-13.0114147793063, -38.4713333988658],
  [-13.0113831914868, -38.4730950903594],
  [-13.0123859903208, -38.4765858689933],
  [-13.0133818207799, -38.4784734441026],
  [-13.0132611972067, -38.4799048645921],
  [-13.0121886008536, -38.4802610996028],
  [-13.0111380325854, -38.4803303085073],
  [-13.0099008359757, -38.4799341676366],
  [-13.0092473939278, -38.4761190405913],
  [-13.0073730488038, -38.4737322069999],
  [-13.0061638823089, -38.4724059379077],
  [-13.0041371641039, -38.4699277115159],
  [-13.0035465352826, -38.4678916987891],
  [-13.005546538012, -38.4669350756565],
  [-13.0086881615054, -38.4673729585435],
  [-13.0102057813107, -38.468414921628],
];

const nordesteDeAmaralinaLocation: Location = {
  id: "fallback-location-nordeste-de-amaralina",
  parent_id: salvadorLocation.id,
  type: LocationType.DISTRICT,
  slug: "nordeste-de-amaralina",
  name: "Nordeste de Amaralina",
  full_name: "Nordeste de Amaralina, Salvador - BA",
  geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
  status: LocationStatus.ACTIVE,
  metadata: {
    population: 1248,
    business_count: 82,
    services_count: 37,
    classifieds_count: 18,
    center_latitude: -13.00912935,
    center_longitude: -38.47367582,
    [FALLBACK_BOUNDARY_RINGS_KEY]: [nordesteDeAmaralinaBoundaryRing],
    source_object_id: 112,
    [PUBLIC_FALLBACK_FLAG]: true,
  },
  created_at: FALLBACK_TIMESTAMP,
  updated_at: FALLBACK_TIMESTAMP,
};

const pitubaLocation: Location = {
  id: "fallback-location-pituba",
  parent_id: salvadorLocation.id,
  type: LocationType.DISTRICT,
  slug: "pituba",
  name: "Pituba",
  full_name: "Pituba, Salvador - BA",
  geographic_path: "/br/ba/salvador/pituba",
  status: LocationStatus.ACTIVE,
  metadata: {
    population: 65000,
    business_count: 542,
    services_count: 214,
    classifieds_count: 1200,
    center_latitude: -13.0042,
    center_longitude: -38.4576,
    [PUBLIC_FALLBACK_FLAG]: true,
  },
  created_at: FALLBACK_TIMESTAMP,
  updated_at: FALLBACK_TIMESTAMP,
};

const complexoNordesteGroup: TerritorialGroupWithMembers = {
  id: "fallback-group-complexo-nordeste",
  slug: "complexo-do-nordeste-de-amaralina",
  name: "Complexo do Nordeste de Amaralina",
  description: "Fallback publico da comunidade territorial.",
  anchor_city_id: salvadorLocation.id,
  status: TERRITORIAL_GROUP_STATUS.ACTIVE,
  metadata: {
    [PUBLIC_FALLBACK_FLAG]: true,
  },
  members: [nordesteDeAmaralinaLocation],
  created_at: FALLBACK_TIMESTAMP,
  updated_at: FALLBACK_TIMESTAMP,
};

export function isPublicTerritoryFallbackLocation(location: Location | null | undefined): boolean {
  return Boolean(location?.metadata?.[PUBLIC_FALLBACK_FLAG] === true);
}

export function resolvePublicTerritoryFallback(input: FallbackInput): ResolvedTerritory {
  const state = normalizeSegment(input.state);
  const city = normalizeSegment(input.city);
  const territorySlug = normalizeSegment(input.territorySlug);

  if (state !== "ba" || city !== "salvador") {
    return null;
  }

  if (!territorySlug) {
    return { kind: "location", location: salvadorLocation };
  }

  if (territorySlug === nordesteDeAmaralinaLocation.slug) {
    return { kind: "location", location: nordesteDeAmaralinaLocation };
  }

  if (territorySlug === pitubaLocation.slug) {
    return { kind: "location", location: pitubaLocation };
  }

  if (territorySlug === complexoNordesteGroup.slug) {
    return { kind: "group", group: complexoNordesteGroup };
  }

  return null;
}
