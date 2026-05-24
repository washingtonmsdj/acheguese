import { describe, expect, it } from "vitest";

import {
  buildTerritorialMetadata,
  type GroupSeoInput,
  type LocationSeoInput,
} from "@/core/routing/seo/buildTerritorialMetadata";
import { LocationStatus, LocationType } from "@/core/location/types";

const districtLocation = {
  id: "district-1",
  parent_id: "city-1",
  type: LocationType.DISTRICT,
  slug: "nordeste-de-amaralina",
  name: "Nordeste de Amaralina",
  full_name: "Nordeste de Amaralina, Salvador - BA",
  geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
  status: LocationStatus.ACTIVE,
  metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
} satisfies LocationSeoInput["location"];

const territorialGroup = {
  id: "group-1",
  slug: "complexo-do-nordeste-de-amaralina",
  name: "Complexo do Nordeste de Amaralina",
  description: null,
  anchor_city_id: "city-1",
  status: "active",
  metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  members: [districtLocation],
} satisfies GroupSeoInput["group"];

describe("buildTerritorialMetadata", () => {
  it("usa titulo editorial no hub de grupo territorial", () => {
    const meta = buildTerritorialMetadata({
      kind: "group",
      group: territorialGroup,
      module: null,
      canonicalPath: "/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(meta.title).toBe("Complexo do Nordeste de Amaralina | Achegue-se");
    expect(meta.description).toContain("Conheça Complexo do Nordeste de Amaralina, Salvador.");
    expect(meta.description).toContain("Comunidade, empresas, serviços e mobilidade hiperlocal.");
  });

  it("preserva titulo operacional em modulo territorial", () => {
    const meta = buildTerritorialMetadata({
      kind: "group",
      group: territorialGroup,
      module: "comunidade",
      canonicalPath: "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    });

    expect(meta.title).toBe(
      "Achegue-se Complexo do Nordeste de Amaralina | Comunidade em Salvador",
    );
  });

  it("extrai a cidade correta em modulo com prefixo de rota", () => {
    const meta = buildTerritorialMetadata({
      kind: "group",
      group: territorialGroup,
      module: "empresas",
      canonicalPath: "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(meta.title).toBe(
      "Achegue-se Complexo do Nordeste de Amaralina | Empresas em Salvador",
    );
  });

  it("usa titulo editorial no hub de bairro", () => {
    const meta = buildTerritorialMetadata({
      kind: "location",
      location: districtLocation,
      module: null,
      canonicalPath: "/ba/salvador/nordeste-de-amaralina",
    });

    expect(meta.title).toBe("Nordeste de Amaralina | Achegue-se");
    expect(meta.description).toContain("Conheça Nordeste de Amaralina, Salvador.");
  });
});
