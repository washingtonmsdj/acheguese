import { describe, expect, it } from "vitest";
import {
  classifyMigrationDrift,
  parseSupabaseMigrationListOutput,
} from "../../scripts/lib/supabase-migration-list-parser.mjs";

describe("Supabase migration list parser", () => {
  it("conta a saida completa em memoria mesmo acima de 20 mil caracteres", () => {
    const rows = Array.from({ length: 900 }, (_, index) => {
      const version = `2026${String(index).padStart(10, "0")}`;
      const remote = index === 899 ? "" : version;
      return `${version} | ${remote} | 2026-08-10 12:00:00`;
    });
    const output = ["LOCAL | REMOTE | TIME (UTC)", ...rows].join("\n");

    expect(output.length).toBeGreaterThan(20_000);
    const parsed = parseSupabaseMigrationListOutput(output);
    const drift = classifyMigrationDrift(parsed);

    expect(parsed).toHaveLength(900);
    expect(drift.remoteOnly).toHaveLength(0);
    expect(drift.localOnly.map((row) => row.local)).toEqual(["20260000000899"]);
  });
});
