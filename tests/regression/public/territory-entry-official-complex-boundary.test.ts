import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("official Complexo boundary on public entry", () => {
  it("keeps the fallback group aligned with all four official neighborhoods", () => {
    const source = read("src/core/routing/utils/publicTerritoryFallbacks.ts");

    expect(source).toContain('slug: "nordeste-de-amaralina"');
    expect(source).toContain('slug: "santa-cruz"');
    expect(source).toContain('slug: "vale-das-pedrinhas"');
    expect(source).toContain('slug: "chapada-do-rio-vermelho"');
    expect(source).toContain("sourceObjectId: 112");
    expect(source).toContain("sourceObjectId: 142");
    expect(source).toContain("sourceObjectId: 163");
    expect(source).toContain("sourceObjectId: 54");
    expect(source).toContain("GeoSalvador bairros_app_dados_2010_e_2022");
    expect(source).not.toContain("fallback_boundary_rings");
    expect(source).not.toContain("nordesteDeAmaralinaBoundaryRing");
  });

  it("never renders a partial group boundary as the Complexo perimeter", () => {
    const source = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");

    expect(source).toContain("hasCompleteGroupBoundary");
    expect(source).toContain("resolved.group.members.every");
    expect(source).toContain("hasCompleteGroupBoundary ? polygons : []");
    expect(source).toContain("Não exibimos contorno aproximado ou incompleto do Complexo.");
  });
});