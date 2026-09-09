import { extractCityStateFromPath } from "@/core/location/utils/territoryHelpers";
import type {
  Professional,
  ProfessionalCategory,
  ProfessionalDataRecord,
  ProfessionalStatus,
  ProfessionalVisibility,
} from "@/core/professional/types";

type JsonRecord = Record<string, unknown>;

type ProfileRelation = {
  id?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
};

type AddressRelation = {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type LocationRelation = {
  geographic_path?: string | null;
  name?: string | null;
  full_name?: string | null;
  type?: string | null;
  slug?: string | null;
};

type ProfessionalRow = Partial<ProfessionalDataRecord> & {
  id?: string | null;
  geographic_path?: string | null;
  profiles?: ProfileRelation | ProfileRelation[] | null;
  profile?: ProfileRelation | ProfileRelation[] | null;
  address?: AddressRelation | AddressRelation[] | null;
  addresses?: AddressRelation | AddressRelation[] | null;
  location?: LocationRelation | LocationRelation[] | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function statusFromRow(row: ProfessionalRow): ProfessionalStatus {
  return row.is_accepting_clients === false ? "inactive" : "active";
}

function extractPortfolioImages(row: ProfessionalRow): string[] {
  const portfolioItems = Array.isArray(row.portfolio_items) ? row.portfolio_items : [];
  return portfolioItems
    .map((item) => asRecord(item).url)
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
}

function extractTerritory(row: ProfessionalRow, metadata: JsonRecord): {
  geographicPath?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
} {
  const metadataLocation = asRecord(metadata.location);
  const location = firstRelation(row.location);
  const geographicPath = optionalString(row.geographic_path) ?? optionalString(location?.geographic_path);

  if (!geographicPath) {
    return {
      city: optionalString(metadataLocation.city),
      state: optionalString(metadataLocation.state),
      neighborhood: optionalString(metadataLocation.neighborhood),
    };
  }

  const { city, state } = extractCityStateFromPath(geographicPath);
  const parts = geographicPath.split("/").filter(Boolean);
  const neighborhood = parts.length > 3 ? parts[parts.length - 1] : undefined;

  return {
    geographicPath,
    city,
    state,
    neighborhood: optionalString(metadataLocation.neighborhood) ?? neighborhood,
  };
}

export function mapProfessionalRow(row: ProfessionalRow): Professional {
  const profile = firstRelation(row.profiles) ?? firstRelation(row.profile);
  const address = firstRelation(row.address) ?? firstRelation(row.addresses);
  const metadata = asRecord(row.metadata);
  const socialLinks = asRecord(metadata.social_links);
  const territory = extractTerritory(row, metadata);

  const professionalDataId = row.id ?? "";
  const serviceCategory = optionalString(row.service_category) ?? "outros";
  const name = optionalString(row.professional_name) ?? optionalString(profile?.name) ?? "Profissional";
  const metadataRating = asNumber(metadata.rating, 0);

  return {
    professional_data_id: professionalDataId,
    id: professionalDataId,
    profile_id: row.profile_id ?? "",
    slug: optionalString(row.slug),
    name,
    description: row.description ?? "",
    category: serviceCategory as ProfessionalCategory,
    subcategory: optionalString(row.service_subcategory),
    location_id: row.location_id ?? undefined,
    geographic_path: territory.geographicPath,
    address: [address?.street, address?.number].filter(Boolean).join(", ") || undefined,
    neighborhood: territory.neighborhood,
    city: territory.city,
    state: territory.state,
    latitude: optionalNumber(address?.latitude) ?? optionalNumber(metadata.latitude),
    longitude: optionalNumber(address?.longitude) ?? optionalNumber(metadata.longitude),
    certifications: asStringArray(row.certifications),
    experience_years: row.experience_years ?? undefined,
    education: optionalString(row.education),
    price_range: optionalString(row.price_range),
    available_hours: asRecord(row.available_hours),
    logo_url: optionalString(metadata.logo_url),
    banner_url: optionalString(metadata.banner_url),
    portfolio_images: extractPortfolioImages(row),
    instagram: optionalString(socialLinks.instagram),
    facebook: optionalString(socialLinks.facebook),
    linkedin: optionalString(socialLinks.linkedin),
    website: optionalString(socialLinks.website),
    status: statusFromRow(row),
    is_verified: Boolean(row.is_verified ?? profile?.verified),
    verified_at: row.verified_at ?? undefined,
    is_accepting_clients: row.is_accepting_clients ?? true,
    visibility: row.visibility as ProfessionalVisibility | undefined,
    availability_notes: optionalString(row.availability_notes),
    rating: row.rating ?? metadataRating,
    total_reviews: asNumber(metadata.total_reviews, 0),
    total_jobs: asNumber(metadata.total_jobs, 0),
    response_time: optionalString(metadata.response_time),
    languages: asStringArray(metadata.languages),
    created_at: row.created_at ?? new Date(0).toISOString(),
    updated_at: row.updated_at ?? new Date(0).toISOString(),
  };
}

export function mapProfessionalRows(rows: ProfessionalRow[] | null | undefined): Professional[] {
  return (rows ?? []).map(mapProfessionalRow);
}
