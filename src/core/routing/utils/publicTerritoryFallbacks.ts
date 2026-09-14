import {
  LocationStatus,
  LocationType,
  type Location,
} from "@/core/location/types";
import {
  TERRITORIAL_GROUP_STATUS,
  type TerritorialGroupWithMembers,
} from "@/core/territorial/contracts";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

type FallbackInput = {
  state?: string | null;
  city?: string | null;
  territorySlug?: string | null;
};

const FALLBACK_TIMESTAMP = "2026-01-01T00:00:00.000Z";
const PUBLIC_FALLBACK_FLAG = "public_fallback";
const PUBLIC_LABEL_KEY = "public_label";
const PUBLIC_ARTICLE_KEY = "public_article";
const GEO_SALVADOR_BOUNDARY_SOURCE =
  "https://services6.arcgis.com/GP5qdNaePRPh2SdT/arcgis/rest/services/bairros_app_dados_2010_e_2022/FeatureServer/0";

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

function readPublicLabel(
  name: string,
  metadata: Record<string, unknown> | null | undefined,
): string {
  const publicLabel = metadata?.[PUBLIC_LABEL_KEY];
  return typeof publicLabel === "string" && publicLabel.trim().length > 0
    ? publicLabel.trim()
    : name;
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

type OfficialFallbackLocationInput = {
  slug: string;
  name: string;
  publicLabel?: string;
  sourceObjectId: number;
  centerLatitude: number;
  centerLongitude: number;
};

function createOfficialComplexLocation({
  slug,
  name,
  publicLabel,
  sourceObjectId,
  centerLatitude,
  centerLongitude,
}: OfficialFallbackLocationInput): Location {
  return {
    id: `fallback-location-${slug}`,
    parent_id: salvadorLocation.id,
    type: LocationType.DISTRICT,
    slug,
    name,
    full_name: `${name}, Salvador - BA`,
    geographic_path: `/br/ba/salvador/${slug}`,
    status: LocationStatus.ACTIVE,
    metadata: {
      center_latitude: centerLatitude,
      center_longitude: centerLongitude,
      source_name: "GeoSalvador bairros_app_dados_2010_e_2022",
      source_level: "municipal_neighborhood",
      source_url: GEO_SALVADOR_BOUNDARY_SOURCE,
      source_object_id: sourceObjectId,
      official: true,
      geometry_format: "GeoJSON",
      ...(publicLabel ? { [PUBLIC_LABEL_KEY]: publicLabel } : {}),
      [PUBLIC_FALLBACK_FLAG]: true,
    },
    created_at: FALLBACK_TIMESTAMP,
    updated_at: FALLBACK_TIMESTAMP,
  };
}

const chapadaDoRioVermelhoLocation = createOfficialComplexLocation({
  slug: "chapada-do-rio-vermelho",
  name: "Chapada do Rio Vermelho",
  publicLabel: "Chapada",
  sourceObjectId: 54,
  centerLatitude: -13.00516291,
  centerLongitude: -38.48064788,
});

const nordesteDeAmaralinaLocation = createOfficialComplexLocation({
  slug: "nordeste-de-amaralina",
  name: "Nordeste de Amaralina",
  sourceObjectId: 112,
  centerLatitude: -13.00912935,
  centerLongitude: -38.47367582,
});

const santaCruzLocation = createOfficialComplexLocation({
  slug: "santa-cruz",
  name: "Santa Cruz",
  sourceObjectId: 142,
  centerLatitude: -13.00369176,
  centerLongitude: -38.47539865,
});

const valeDasPedrinhasLocation = createOfficialComplexLocation({
  slug: "vale-das-pedrinhas",
  name: "Vale das Pedrinhas",
  sourceObjectId: 163,
  centerLatitude: -13.00852241,
  centerLongitude: -38.4803529,
});

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
    [PUBLIC_LABEL_KEY]: "Complexo",
    [PUBLIC_ARTICLE_KEY]: "o",
    [PUBLIC_FALLBACK_FLAG]: true,
  },
  members: [
    nordesteDeAmaralinaLocation,
    santaCruzLocation,
    valeDasPedrinhasLocation,
    chapadaDoRioVermelhoLocation,
  ],
  created_at: FALLBACK_TIMESTAMP,
  updated_at: FALLBACK_TIMESTAMP,
};

export function getPublicTerritoryLocationLabel(location: Location): string {
  return readPublicLabel(
    location.name,
    location.metadata as Record<string, unknown> | null | undefined,
  );
}

export function getPublicTerritoryGroupPresentation(
  group: TerritorialGroupWithMembers,
): { label: string; article: "o" | "a" | null } {
  const metadata = group.metadata as Record<string, unknown> | null | undefined;
  const article = metadata?.[PUBLIC_ARTICLE_KEY];
  return {
    label: readPublicLabel(group.name, metadata),
    article: article === "o" || article === "a" ? article : null,
  };
}

export function isPublicTerritoryFallbackLocation(
  location: Location | null | undefined,
): boolean {
  return Boolean(location?.metadata?.[PUBLIC_FALLBACK_FLAG] === true);
}

export function resolvePublicTerritoryFallback(
  input: FallbackInput,
): ResolvedTerritory {
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
