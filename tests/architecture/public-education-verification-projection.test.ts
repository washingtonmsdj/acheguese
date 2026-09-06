import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("public Education verification projection", () => {
  it("repairs historical seeded verification without deleting provenance", () => {
    const repair = read(
      "supabase/migrations/20260906083000_repair_public_education_verification_projection_g6.sql",
    );

    expect(repair).toContain("public_education_seed");
    expect(repair).toContain("v_seeded_count <> 15");
    expect(repair).toContain("SET\n    is_verified = FALSE");
    expect(repair).toContain("verified = FALSE");
    expect(repair).toContain("verified_at = NULL");
    expect(repair).toContain("public_record_provenance_status");
    expect(repair).toContain("source_backed_unclaimed");
  });

  it("keeps public school provenance separate from the verification badge", () => {
    const seed = read(
      "supabase/migrations/20260520120000_seed_public_education_complexo_schools.sql",
    );
    const verification = read(
      "supabase/migrations/20260718150000_consolidate_profile_verification_core.sql",
    );

    expect(seed).toContain("school_source_url");
    expect(seed).toContain("platform_curated_pending_official_claim");
    expect(verification).toContain(
      "source of truth is approved document verification",
    );
  });
});
