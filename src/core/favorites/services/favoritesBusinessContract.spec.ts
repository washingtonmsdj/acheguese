import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("business favorites runtime contract", () => {
  it("does not use the legacy business_favorites table in core services", () => {
    const serviceFiles = [
      "businessFavoriteAdapters.ts",
      "favorites.queries.ts",
      "favorites.mutations.ts",
    ].map((fileName) => resolve(process.cwd(), "src/core/favorites/services", fileName));

    for (const filePath of serviceFiles) {
      const source = readFileSync(filePath, "utf8");

      expect(source).not.toContain("business_favorites");
      expect(source).not.toContain("BUSINESS_FAVORITES_TABLE");
    }
  });
});
