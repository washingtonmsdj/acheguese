import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import type {
  AddressPrecision,
  GeocodingSource,
} from "@/core/address/types";
import type {
  Business,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../types";

type BusinessAddressInput = CreateBusinessInput | UpdateBusinessInput;

export const BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE = 0.7;

export interface BusinessAddressResolution {
  locationId: string;
  postalCode: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  latitude?: number;
  longitude?: number;
  precision?: AddressPrecision;
  geocodingSource?: GeocodingSource;
  geocodingConfidence?: number | null;
  geocodedAt?: string | null;
}

const ADDRESS_SYNC_FIELDS = [
  "address_street",
  "address_number",
  "address_complement",
  "postal_code",
] as const;

const ADDRESS_LOCATOR_FIELDS = [
  "address_street",
  "address_number",
  "postal_code",
  "location_id",
] as const;

function hasDefinedField(
  input: BusinessAddressInput,
  field: keyof BusinessAddressInput,
): boolean {
  return input[field] !== undefined;
}

function hasAnyDefinedField(
  input: BusinessAddressInput,
  fields: readonly (keyof BusinessAddressInput)[],
): boolean {
  return fields.some((field) => hasDefinedField(input, field));
}

function normalizeAddressToken(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

function hasCompleteCoordinatePair(input: BusinessAddressInput): boolean {
  return (
    typeof input.latitude === "number" &&
    Number.isFinite(input.latitude) &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.longitude)
  );
}

function selectedTerritoryMatches(
  locationId: string,
  result: Awaited<ReturnType<typeof locationGeocodingService.geocode>>[number],
): boolean {
  const territoryIds = new Set(
    [
      result.territory.authoritativeLocation?.id,
      result.territory.district?.id,
      result.territory.city?.id,
      result.territory.state?.id,
    ].filter((value): value is string => Boolean(value)),
  );

  return territoryIds.has(locationId);
}

function providerHouseNumberMatches(
  requestedNumber: string | null,
  providerNumber: string | null,
): boolean {
  if (!requestedNumber || !providerNumber) return true;
  return (
    normalizeAddressToken(requestedNumber) ===
    normalizeAddressToken(providerNumber)
  );
}

function mapGeocodingSource(source: string): GeocodingSource {
  switch (source) {
    case "nominatim":
      return "nominatim_osm";
    case "google":
      return "google";
    default:
      throw new Error(
        `Provider de geocoding sem proveniencia suportada: ${source || "desconhecido"}`,
      );
  }
}

function buildGeocodingQuery(params: {
  street: string;
  number: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}): string {
  return [
    params.street,
    params.number,
    params.neighborhood,
    params.city,
    params.state,
    params.postalCode,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

export async function resolveBusinessAddressForPersistence(
  input: BusinessAddressInput,
  currentBusiness?: Business | null,
): Promise<BusinessAddressResolution | null> {
  if (input.address_id !== undefined) {
    return null;
  }

  const hasExistingAddress = Boolean(currentBusiness?.address_id);
  const hasAddressSyncPatch = hasAnyDefinedField(input, ADDRESS_SYNC_FIELDS);
  const hasCoordinatePatch =
    hasDefinedField(input, "latitude") || hasDefinedField(input, "longitude");
  const hasLocationPatch = hasDefinedField(input, "location_id");

  const shouldSyncAddress =
    Boolean(input.address_street) ||
    (hasExistingAddress &&
      (hasAddressSyncPatch || hasCoordinatePatch || hasLocationPatch));

  if (!shouldSyncAddress) {
    return null;
  }

  const locationId =
    input.location_id ?? currentBusiness?.location_id ?? undefined;
  if (!locationId) {
    throw new Error(
      "Selecione o territorio antes de salvar o endereco fisico",
    );
  }

  const street =
    input.address_street ?? currentBusiness?.address?.street ?? undefined;
  if (!street?.trim()) {
    throw new Error("Informe a rua para salvar o endereco fisico");
  }

  const number =
    input.address_number ?? currentBusiness?.address?.number ?? null;
  const complement =
    input.address_complement ?? currentBusiness?.address?.complement ?? null;
  const postalCode =
    input.postal_code ??
    input.cep ??
    currentBusiness?.address?.postal_code ??
    currentBusiness?.business_zip ??
    null;

  if (hasCoordinatePatch && !hasCompleteCoordinatePair(input)) {
    throw new Error(
      "Latitude e longitude devem ser informadas juntas",
    );
  }

  if (hasCompleteCoordinatePair(input)) {
    return {
      locationId,
      postalCode,
      street,
      number,
      complement,
      latitude: input.latitude,
      longitude: input.longitude,
      precision: "exact",
      geocodingSource: "manual",
      geocodingConfidence: null,
      geocodedAt: new Date().toISOString(),
    };
  }

  const locatorChanged = hasAnyDefinedField(input, ADDRESS_LOCATOR_FIELDS);
  const existingCoordinatesComplete =
    typeof currentBusiness?.address?.latitude === "number" &&
    Number.isFinite(currentBusiness.address.latitude) &&
    typeof currentBusiness?.address?.longitude === "number" &&
    Number.isFinite(currentBusiness.address.longitude);

  if (!locatorChanged && existingCoordinatesComplete) {
    return {
      locationId,
      postalCode,
      street,
      number,
      complement,
    };
  }

  const city =
    input.city ?? (hasLocationPatch ? null : currentBusiness?.business_city ?? null);
  const state =
    input.state ?? (hasLocationPatch ? null : currentBusiness?.business_state ?? null);
  const neighborhood =
    input.neighborhood ?? (hasLocationPatch ? null : currentBusiness?.location?.name ?? null);
  const query = buildGeocodingQuery({
    street,
    number,
    postalCode,
    neighborhood,
    city,
    state,
  });

  const results = await locationGeocodingService.geocode({
    query,
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    country: "BR",
    limit: 5,
  });

  const candidates = results
    .filter(
      (result) =>
        result.confidence >= BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE &&
        selectedTerritoryMatches(locationId, result) &&
        providerHouseNumberMatches(number, result.providerAddress.number),
    )
    .sort((left, right) => right.confidence - left.confidence);

  const best = candidates[0];
  if (!best) {
    throw new Error(
      "Nao foi possivel localizar o endereco com precisao de rua dentro do territorio selecionado. Revise rua, numero, CEP e territorio.",
    );
  }

  return {
    locationId,
    postalCode,
    street,
    number,
    complement,
    latitude: best.coordinates.latitude,
    longitude: best.coordinates.longitude,
    precision:
      number && best.providerAddress.number ? "exact" : "street",
    geocodingSource: mapGeocodingSource(best.source),
    geocodingConfidence: best.confidence,
    geocodedAt: new Date().toISOString(),
  };
}
