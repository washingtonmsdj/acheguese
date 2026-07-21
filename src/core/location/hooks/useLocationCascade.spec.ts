import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { LocationStatus, LocationType } from "../types";

const findAllMock = vi.fn();
const findChildrenMock = vi.fn();

vi.mock("../repositories/createLocationRepository", () => ({
  createLocationRepository: () => ({
    findAll: findAllMock,
    findChildren: findChildrenMock,
  }),
}));

import {
  fetchAllChildrenByType,
  fetchSelectableLocalities,
  useLocationCascade,
  useCityLocalities,
} from "./useLocationCascade";

// Mojibake versions of "São Paulo", "Salvador (Bahia)", "Nordeste de Amaralina"
const MOJIBAKE_STATE = "SÃ£o Paulo";
const EXPECTED_STATE = "S\u00e3o Paulo";
const MOJIBAKE_CITY = "SÃ£o Gon\u00c3\u00a7alo";
const EXPECTED_CITY = "S\u00e3o Gon\u00e7alo";
const MOJIBAKE_NEIGHBORHOOD = "Nordeste de Amaralina - Se\u00c3\u00a7\u00c3\u00a3o A";
const EXPECTED_NEIGHBORHOOD = "Nordeste de Amaralina - Se\u00e7\u00e3o A";

function makeLocation(overrides: Partial<Record<string, unknown>>) {
  return {
    id: "id-" + Math.random().toString(36).slice(2),
    parent_id: null,
    type: LocationType.STATE,
    slug: "slug",
    name: "name",
    full_name: "full",
    geographic_path: "/br/xx",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

beforeEach(() => {
  findAllMock.mockReset();
  findChildrenMock.mockReset();
});

describe("useLocationCascade - normalizacao de encoding", () => {
  it("fetchAllChildrenByType normaliza mojibake nos nomes retornados", async () => {
    findChildrenMock.mockResolvedValueOnce({
      locations: [
        makeLocation({
          type: LocationType.CITY,
          name: MOJIBAKE_CITY,
          slug: "sao-goncalo",
          geographic_path: "/br/rj/sao-goncalo",
        }),
      ],
    });

    const result = await fetchAllChildrenByType("state-1", LocationType.CITY);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(EXPECTED_CITY);
    expect(result[0].name).not.toContain("\u00c3");
  });

  it("fetchAllChildrenByType ordena por nome ja normalizado", async () => {
    findChildrenMock.mockResolvedValueOnce({
      locations: [
        makeLocation({ type: LocationType.CITY, name: "Zabele", slug: "z" }),
        makeLocation({ type: LocationType.CITY, name: MOJIBAKE_CITY, slug: "s" }),
        makeLocation({ type: LocationType.CITY, name: "Abaete", slug: "a" }),
      ],
    });

    const result = await fetchAllChildrenByType("state-1", LocationType.CITY);
    expect(result.map((r) => r.name)).toEqual(["Abaete", EXPECTED_CITY, "Zabele"]);
  });

  it("fetchSelectableLocalities normaliza bairros municipais", async () => {
    findChildrenMock.mockResolvedValueOnce({
      locations: [
        makeLocation({
          type: LocationType.NEIGHBORHOOD,
          name: MOJIBAKE_NEIGHBORHOOD,
          slug: "nordeste",
          geographic_path: "/br/ba/salvador/nordeste",
        }),
      ],
    });

    const result = await fetchSelectableLocalities("salvador-id");
    expect(result[0].name).toBe(EXPECTED_NEIGHBORHOOD);
  });

  it("fetchSelectableLocalities usa districts como fallback quando nao ha neighborhoods, normalizando ambos", async () => {
    findChildrenMock
      .mockResolvedValueOnce({ locations: [] }) // neighborhoods vazio
      .mockResolvedValueOnce({
        locations: [
          makeLocation({
            type: LocationType.DISTRICT,
            name: MOJIBAKE_NEIGHBORHOOD,
            slug: "distrito",
          }),
        ],
      });

    const result = await fetchSelectableLocalities("city-sem-bairros");
    expect(findChildrenMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe(EXPECTED_NEIGHBORHOOD);
    expect(result[0].type).toBe(LocationType.DISTRICT);
  });

  it("useLocationCascade normaliza estados carregados via findAll", async () => {
    findAllMock.mockResolvedValueOnce([
      makeLocation({
        type: LocationType.STATE,
        name: MOJIBAKE_STATE,
        slug: "sp",
        geographic_path: "/br/sp",
      }),
      makeLocation({
        type: LocationType.STATE,
        name: "Bahia",
        slug: "ba",
        geographic_path: "/br/ba",
      }),
      // deve ser filtrado (inativo)
      makeLocation({
        type: LocationType.STATE,
        name: "Inativo",
        status: LocationStatus.INACTIVE,
      }),
    ]);

    const { result } = renderHook(() => useLocationCascade(null, null));

    await waitFor(() => expect(result.current.loadingStates).toBe(false));

    const names = result.current.states.map((s) => s.name);
    expect(names).toEqual(["Bahia", EXPECTED_STATE]);
    names.forEach((n) => expect(n).not.toContain("\u00c3"));
  });

  it("useCityLocalities normaliza os localities carregados", async () => {
    findChildrenMock.mockResolvedValueOnce({
      locations: [
        makeLocation({
          type: LocationType.NEIGHBORHOOD,
          name: MOJIBAKE_NEIGHBORHOOD,
          slug: "n",
        }),
      ],
    });

    const { result } = renderHook(() => useCityLocalities("city-1"));

    await waitFor(() => expect(result.current.loadingLocalities).toBe(false));

    expect(result.current.localities).toHaveLength(1);
    expect(result.current.localities[0].name).toBe(EXPECTED_NEIGHBORHOOD);
  });

  it("nomes normalizados permitem comparacao/selecao consistente entre valores persistidos", async () => {
    // Simula um valor "persistido" ja mojibaked que a UI compara com o option carregado
    const persistedFromDb = MOJIBAKE_NEIGHBORHOOD;

    findChildrenMock.mockResolvedValueOnce({
      locations: [
        makeLocation({
          type: LocationType.NEIGHBORHOOD,
          name: MOJIBAKE_NEIGHBORHOOD,
          slug: "n",
        }),
      ],
    });

    const options = await fetchSelectableLocalities("city");
    const { normalizePersistedTextEncoding } = await import(
      "@/shared/utils/textEncodingRepair"
    );

    // Comparacao ingenua falha
    expect(options[0].name === persistedFromDb).toBe(false);
    // Comparacao apos normalizar os dois lados funciona
    expect(options[0].name === normalizePersistedTextEncoding(persistedFromDb)).toBe(true);
  });
});
