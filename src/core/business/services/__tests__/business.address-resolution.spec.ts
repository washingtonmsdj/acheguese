import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Business, CreateBusinessInput } from "@/core/business/types";

const mocks = vi.hoisted(() => ({
  geocode: vi.fn(),
}));

vi.mock("@/core/location/services/LocationGeocodingService", () => ({
  locationGeocodingService: {
    geocode: mocks.geocode,
  },
}));

import {
  BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE,
  resolveBusinessAddressForPersistence,
} from "../business.address-resolution";

const locationId = "00000000-0000-4000-8000-000000000001";

const input: CreateBusinessInput = {
  name: "Empresa Teste",
  description: "Descricao valida para o cadastro da empresa",
  category: "servicos",
  location_id: locationId,
  email: "contato@empresa.test",
  address_street: "Rua Teste",
  address_number: "10",
  postal_code: "40000-000",
  neighborhood: "Pituba",
  city: "Salvador",
  state: "BA",
};

function geocodeResult(overrides: Record<string, unknown> = {}) {
  return {
    displayAddress: "Rua Teste, 10, Pituba, Salvador, Bahia, Brasil",
    coordinates: {
      latitude: -12.982,
      longitude: -38.455,
    },
    confidence: 0.9,
    source: "nominatim",
    providerAddress: {
      formattedAddress: "Rua Teste, 10, Pituba, Salvador, Bahia, Brasil",
      street: "Rua Teste",
      number: "10",
      complement: null,
      neighborhood: "Pituba",
      city: "Salvador",
      state: "Bahia",
      postalCode: "40000-000",
      country: "Brasil",
    },
    systemAddress: {
      street: "Rua Teste",
      number: "10",
      complement: null,
      neighborhood: "Pituba",
      city: "Salvador",
      state: "Bahia",
      stateCode: "BA",
      postalCode: "40000-000",
      country: "Brasil",
    },
    territory: {
      sourceOfTruth: "locations",
      status: "matched",
      reviewStatus: "resolved",
      reviewReason: null,
      state: { id: "state-ba" },
      city: { id: "city-salvador" },
      district: { id: locationId },
      groups: [],
      authoritativeLocation: { id: locationId },
    },
    ...overrides,
  };
}

describe("Business address resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.geocode.mockResolvedValue([geocodeResult()]);
  });

  it("does not discard a partial physical Address patch when no Address exists", async () => {
    await expect(resolveBusinessAddressForPersistence({
      address_complement: "Sala sem endereço",
    })).rejects.toThrow("Informe a rua para cadastrar o endereco fisico");
    expect(mocks.geocode).not.toHaveBeenCalled();
  });

  it("geocodes a new physical address through the canonical location owner", async () => {
    const result = await resolveBusinessAddressForPersistence(input);

    expect(mocks.geocode).toHaveBeenCalledWith({
      query: expect.stringContaining("Rua Teste"),
      city: "Salvador",
      state: "BA",
      country: "BR",
      limit: 5,
    });
    expect(result).toMatchObject({
      locationId,
      street: "Rua Teste",
      number: "10",
      postalCode: "40000-000",
      latitude: -12.982,
      longitude: -38.455,
      precision: "exact",
      geocodingSource: "nominatim_osm",
      geocodingConfidence: 0.9,
      geocodedAt: expect.any(String),
    });
  });

  it("records street precision when the provider resolves a road without house number", async () => {
    mocks.geocode.mockResolvedValue([
      geocodeResult({
        confidence: BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE,
        providerAddress: {
          ...geocodeResult().providerAddress,
          number: null,
        },
      }),
    ]);

    const result = await resolveBusinessAddressForPersistence(input);

    expect(result?.precision).toBe("street");
    expect(result?.geocodingConfidence).toBe(
      BUSINESS_ADDRESS_MIN_GEOCODING_CONFIDENCE,
    );
  });

  it("fails closed when only neighborhood or city precision is available", async () => {
    mocks.geocode.mockResolvedValue([
      geocodeResult({
        confidence: 0.5,
        providerAddress: {
          ...geocodeResult().providerAddress,
          street: null,
          number: null,
        },
      }),
    ]);

    await expect(
      resolveBusinessAddressForPersistence(input),
    ).rejects.toThrow(
      "Nao foi possivel localizar o endereco com precisao de rua dentro do territorio selecionado.",
    );
  });

  it("fails closed when provider coordinates resolve outside the selected territory", async () => {
    mocks.geocode.mockResolvedValue([
      geocodeResult({
        territory: {
          ...geocodeResult().territory,
          district: { id: "other-neighborhood" },
          authoritativeLocation: { id: "other-neighborhood" },
        },
      }),
    ]);

    await expect(
      resolveBusinessAddressForPersistence(input),
    ).rejects.toThrow(
      "Nao foi possivel localizar o endereco com precisao de rua dentro do territorio selecionado.",
    );
  });

  it("never replaces explicit coordinate pairs with provider coordinates", async () => {
    const result = await resolveBusinessAddressForPersistence({
      ...input,
      latitude: -12.99,
      longitude: -38.48,
    });

    expect(mocks.geocode).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      latitude: -12.99,
      longitude: -38.48,
      precision: "exact",
      geocodingSource: "manual",
      geocodingConfidence: null,
    });
  });

  it("re-geocodes an existing physical address when its territory changes", async () => {
    const current = {
      id: "profile-1",
      profile_id: "profile-1",
      business_data_id: "business-1",
      location_id: "old-location",
      address_id: "address-1",
      address: {
        street: "Rua Teste",
        number: "10",
        postal_code: "40000-000",
        latitude: -12.97,
        longitude: -38.44,
      },
      business_city: "Salvador",
      business_state: "BA",
      location: {
        name: "Pituba",
        full_name: "Pituba, Salvador",
      },
    } as Business;

    const result = await resolveBusinessAddressForPersistence(
      { location_id: locationId },
      current,
    );

    expect(mocks.geocode).toHaveBeenCalledTimes(1);
    expect(result?.locationId).toBe(locationId);
    expect(result?.latitude).toBe(-12.982);
  });

  it("re-geocodes a CEP-only alias update for an existing Business Address", async () => {
    const current = {
      id: "profile-1",
      profile_id: "profile-1",
      business_data_id: "business-1",
      location_id: locationId,
      address_id: "address-1",
      business_city: "Salvador",
      business_state: "BA",
      address: {
        street: "Rua Teste",
        number: "10",
        postal_code: "40000-000",
        latitude: -12.982,
        longitude: -38.455,
      },
    } as Business;

    mocks.geocode.mockResolvedValue([geocodeResult({
      providerAddress: {
        ...geocodeResult().providerAddress,
        postalCode: "40123-456",
      },
    })]);
    const result = await resolveBusinessAddressForPersistence(
      { cep: "40123-456" },
      current,
    );

    expect(mocks.geocode).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining("40123-456"),
        country: "BR",
      }),
    );
    expect(result).toMatchObject({
      locationId,
      postalCode: "40123-456",
      latitude: -12.982,
      longitude: -38.455,
      geocodingSource: "nominatim_osm",
    });
  });

  it("rejects coordinates from a provider whose known CEP contradicts the requested CEP", async () => {
    const current = {
      id: "profile-1",
      profile_id: "profile-1",
      business_data_id: "business-1",
      location_id: locationId,
      address_id: "address-1",
      address: {
        street: "Rua Teste",
        number: "10",
        postal_code: "40000-000",
        latitude: -12.982,
        longitude: -38.455,
      },
    } as Business;

    // Default fixture is a high-confidence result in the correct territory
    // but still carries the old postal code.
    await expect(
      resolveBusinessAddressForPersistence({ cep: "40123-456" }, current),
    ).rejects.toThrow("Nao foi possivel localizar o endereco");
    expect(mocks.geocode).toHaveBeenCalledTimes(1);
  });

  it("rejects a CEP-only alias patch when no existing physical Address exists", async () => {
    await expect(
      resolveBusinessAddressForPersistence({ cep: "40123-456" }),
    ).rejects.toThrow("Informe a rua para cadastrar o endereco fisico");
    expect(mocks.geocode).not.toHaveBeenCalled();
  });

  it("does not geocode a non-locator edit when existing coordinates are already complete", async () => {
    const current = {
      id: "profile-1",
      profile_id: "profile-1",
      business_data_id: "business-1",
      location_id: locationId,
      address_id: "address-1",
      address: {
        street: "Rua Teste",
        number: "10",
        complement: "Loja A",
        postal_code: "40000-000",
        latitude: -12.982,
        longitude: -38.455,
      },
    } as Business;

    const result = await resolveBusinessAddressForPersistence(
      { address_complement: "Loja B" },
      current,
    );

    expect(mocks.geocode).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      locationId,
      street: "Rua Teste",
      complement: "Loja B",
    });
    expect(result).not.toHaveProperty("latitude");
    expect(result).not.toHaveProperty("longitude");
    expect(result).not.toHaveProperty("geocodingSource");
  });
});
