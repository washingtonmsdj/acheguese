import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const mutation = read("src/core/territorial/services/territorial.mutations.ts");
const locationEdge = read(
  "supabase/functions/territorial-update-location-visibility/index.ts",
);
const groupEdge = read(
  "supabase/functions/territorial-update-group-visibility/index.ts",
);

describe("G42 territorial visibility client contract", () => {
  it("preserves structured Edge errors instead of flattening FunctionsHttpError", () => {
    expect(mutation).toContain("resolveSupabaseFunctionErrorMessage");
    expect(mutation).toContain(
      "Falha ao atualizar a visibilidade territorial.",
    );
  });

  it("requires the returned entity to match id, flag and requested value", () => {
    expect(mutation).toContain("data.success !== true");
    expect(mutation).toContain("entity.id !== id");
    expect(mutation).toContain("metadata[flag] !== value");
    expect(mutation).not.toContain("return (data ?? {})");
  });

  it("matches the authoritative response envelopes returned by both brokers", () => {
    expect(locationEdge).toContain(
      "JSON.stringify({ success: true, location: updatedLocation })",
    );
    expect(groupEdge).toContain(
      "JSON.stringify({ success: true, group: updatedGroup })",
    );
  });
});
