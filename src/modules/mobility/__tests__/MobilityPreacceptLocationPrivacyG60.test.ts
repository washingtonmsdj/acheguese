import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const broker = readProjectFile(
  "supabase/migrations/20260909173500_broker_driver_offer_read_model_g10.sql",
);
const g60 = readProjectFile(
  "supabase/migrations/20260910230000_redact_preaccept_offer_location_g60.sql",
);

describe("G60 preaccept location privacy boundary", () => {
  it("wraps the existing broker without changing its public signature", () => {
    const signature = "uuid, uuid, text, integer, numeric, numeric, text[], text, boolean";
    expect(broker).toContain("CREATE OR REPLACE FUNCTION public.mobility_list_driver_offers(");
    expect(g60).toContain("RENAME TO mobility_list_driver_offers_base_g60");
    expect(g60).toContain("private.mobility_list_driver_offers_base_g60(");
    expect(g60).toContain(signature);
    expect(g60).toContain("CREATE OR REPLACE FUNCTION public.mobility_list_driver_offers(");
  });

  it("redacts exact route labels and rounds coordinates before browser exposure", () => {
    expect(g60).toContain("raw.value - ARRAY[");
    expect(g60).toContain("'origin'");
    expect(g60).toContain("'destination'");
    expect(g60).toContain("'origin_lat'");
    expect(g60).toContain("'destination_lng'");
    expect(g60).toContain("pickup_location.name");
    expect(g60).toContain("dropoff_location.name");
    expect(g60).toContain("pg_catalog.round((raw.value->>'origin_lat')::numeric, 2)");
    expect(g60).toContain("'location_precision', 'coarse_2dp'");
  });

  it("keeps the offer read boundary service-role only", () => {
    expect(g60).toContain("service_role or postgres session is required");
    expect(g60).toContain("FROM PUBLIC, anon, authenticated");
    expect(g60).toContain("TO service_role");
  });
});
