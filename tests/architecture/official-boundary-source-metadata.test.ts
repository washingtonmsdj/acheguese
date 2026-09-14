import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("official municipal boundary source metadata", () => {
  it("keeps the municipal source manifest and sync writer aligned with the runtime reader", () => {
    const manifest = read("tools/seeds/municipal-neighborhood-sources.ts");
    const sync = read("tools/seeds/sync-municipal-neighborhoods.ts");
    const reader = read(
      "src/core/geospatial/data/officialFeatureServerBoundary.ts",
    );

    expect(manifest).toContain("Manifesto SSOT de fontes municipais oficiais");
    expect(sync).toContain("source_url: source.serviceUrl");
    expect(sync).toContain("source_object_id: objectId || null");
    expect(sync).toContain("official: true");
    expect(reader).toContain("location.metadata?.official !== true");
    expect(reader).toContain("location.metadata?.source_url");
    expect(reader).toContain("location.metadata?.source_object_id");
  });

  it("keeps the versioned Salvador seed marked official before sync enrichment", () => {
    const migration = read(
      "supabase/migrations/20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql",
    );

    expect(migration).toContain(
      "jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true)",
    );
  });
});
