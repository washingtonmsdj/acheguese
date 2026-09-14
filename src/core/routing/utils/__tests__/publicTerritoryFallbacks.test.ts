import { describe, expect, it } from "vitest";
import {
  getPublicTerritoryGroupPresentation,
  getPublicTerritoryLocationLabel,
  resolvePublicTerritoryFallback,
} from "@/core/routing/utils/publicTerritoryFallbacks";

describe("publicTerritoryFallbacks", () => {
  it("keeps canonical geographic names while exposing approved public labels", () => {
    const resolved = resolvePublicTerritoryFallback({
      state: "ba",
      city: "salvador",
      territorySlug: "complexo-do-nordeste-de-amaralina",
    });

    expect(resolved?.kind).toBe("group");
    if (resolved?.kind !== "group") return;

    expect(resolved.group.name).toBe("Complexo do Nordeste de Amaralina");
    expect(getPublicTerritoryGroupPresentation(resolved.group)).toEqual({
      label: "Complexo",
      article: "o",
    });
    expect(resolved.group.members.map((member) => member.name)).toEqual([
      "Nordeste de Amaralina",
      "Santa Cruz",
      "Vale das Pedrinhas",
      "Chapada do Rio Vermelho",
    ]);
    expect(
      resolved.group.members.map((member) =>
        getPublicTerritoryLocationLabel(member),
      ),
    ).toEqual([
      "Nordeste de Amaralina",
      "Santa Cruz",
      "Vale das Pedrinhas",
      "Chapada",
    ]);
  });

  it("falls back to the canonical location name when no public label exists", () => {
    const resolved = resolvePublicTerritoryFallback({
      state: "ba",
      city: "salvador",
      territorySlug: "nordeste-de-amaralina",
    });

    expect(resolved?.kind).toBe("location");
    if (resolved?.kind !== "location") return;

    expect(getPublicTerritoryLocationLabel(resolved.location)).toBe(
      "Nordeste de Amaralina",
    );
  });
});
