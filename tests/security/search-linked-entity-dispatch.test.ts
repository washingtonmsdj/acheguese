import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("search linked entity dispatch", () => {
  it("resolves every allowed linked entity type explicitly", () => {
    const providers = source("src/core/search/providers/searchProviders.ts");

    for (const entityType of [
      "business",
      "professional",
      "classified",
      "event",
      "post",
    ]) {
      expect(providers).toContain(`case "${entityType}":`);
      expect(providers).toContain(`return linkedIds.${entityType};`);
    }

    expect(providers).not.toContain("linkedIds[entityType]");
  });
});
