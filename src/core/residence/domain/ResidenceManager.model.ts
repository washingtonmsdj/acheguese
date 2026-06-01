import { getRecordValue } from "@/shared/utils/recordLookup";
import type { CreateAddressInput } from "@/core/address/types";

export type LookupStatus = "idle" | "loading" | "success" | "error";
export type AddressEntryMode = "cep" | "manual";
export type TerritoryScope = "city" | "district";

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function tryMatchDistrictName(input: string, candidate: string): boolean {
  const a = normalizeSearch(input);
  const b = normalizeSearch(candidate);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata ? getRecordValue(metadata, key) : undefined;
  return typeof value === "string" && value.trim() ? value : null;
}

export function readTerritoryScope(
  metadata: Record<string, unknown> | null | undefined,
): TerritoryScope | null {
  const value = metadata?.canonical_scope;
  return value === "city" || value === "district" ? value : null;
}

interface ResidenceAddressPayloadInput {
  existingMetadata: Record<string, unknown>;
  resolvedLocationId: string;
  cityLocationId: string | null;
  stateLocationId: string | null;
  territoryScope: TerritoryScope | null;
  street: string;
  number: string;
  complement: string;
  postalCode: string;
  localNeighborhood: string;
  cepNeighborhoodCandidate: string;
  territorySummary: string | null;
  resolvedCoordinates: { latitude: number; longitude: number } | null;
}

export function buildResidenceAddressPayload({
  existingMetadata,
  resolvedLocationId,
  cityLocationId,
  stateLocationId,
  territoryScope,
  street,
  number,
  complement,
  postalCode,
  localNeighborhood,
  cepNeighborhoodCandidate,
  territorySummary,
  resolvedCoordinates,
}: ResidenceAddressPayloadInput): CreateAddressInput {
  const canonicalCityId =
    cityLocationId ?? readMetadataString(existingMetadata, "canonical_city_id");
  const canonicalStateId =
    stateLocationId ?? readMetadataString(existingMetadata, "canonical_state_id");
  const canonicalScope =
    territoryScope ??
    readTerritoryScope(existingMetadata) ??
    (resolvedLocationId === canonicalCityId ? "city" : "district");
  const hasStreetAndNumber = Boolean(street.trim() && number.trim());
  const latitude = resolvedCoordinates?.latitude ?? null;
  const longitude = resolvedCoordinates?.longitude ?? null;

  return {
    location_id: resolvedLocationId,
    street: street.trim() || null,
    number: number.trim() || null,
    complement: complement.trim() || null,
    postal_code: postalCode.trim() || null,
    address_type: hasStreetAndNumber ? "exact" : "approximate",
    precision: canonicalScope === "city" ? "city" : "district",
    geocoding_source: "manual",
    latitude,
    longitude,
    metadata: {
      ...existingMetadata,
      local_neighborhood: localNeighborhood,
      address_neighborhood_text: localNeighborhood,
      postal_neighborhood_raw: cepNeighborhoodCandidate || null,
      canonical_country_id: null,
      canonical_country_code: "BR",
      canonical_state_id: canonicalStateId,
      canonical_scope: canonicalScope,
      canonical_label:
        territorySummary ?? readMetadataString(existingMetadata, "canonical_label"),
      reconciliation_status:
        resolvedLocationId === canonicalCityId
          ? localNeighborhood
            ? "city_only"
            : "unresolved"
          : "resolved",
      reconciliation_confidence: resolvedLocationId === canonicalCityId ? 0.7 : 0.95,
      territory_resolution_level:
        resolvedLocationId === canonicalCityId ? "city" : "district",
      canonical_city_id: canonicalCityId,
      canonical_district_id:
        resolvedLocationId && canonicalCityId && resolvedLocationId !== canonicalCityId
          ? resolvedLocationId
          : null,
      territorial_group_id: null,
      latitude,
      longitude,
    },
  };
}
