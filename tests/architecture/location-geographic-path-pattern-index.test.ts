import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260831024311_add_locations_geographic_path_pattern_index_g5.sql";

describe("location geographic path prefix index", () => {
  it("keeps LIKE prefix reads on the dedicated text pattern operator class", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("idx_locations_geographic_path_pattern");
    expect(migration).toContain("geographic_path text_pattern_ops");
    expect(migration).toContain("indisvalid AND i.indisready");
    expect(migration).toContain("failed postcondition");

    expect(migration).not.toContain("DROP INDEX");
    expect(migration).not.toContain("DROP CONSTRAINT");
    expect(migration).not.toContain("CASCADE");
  });
});
