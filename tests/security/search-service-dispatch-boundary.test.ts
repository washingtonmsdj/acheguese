import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/core/search/services/SearchService.ts",
  "utf8",
);

describe("SearchService explicit dispatch boundaries", () => {
  it("validates linked entity types before grouping and never writes through a dynamic key", () => {
    expect(source).toContain("function isAllowedLinkedEntityType(");
    expect(source).toContain("function appendLinkedEntityId(");
    expect(source).toContain(
      "if (!isAllowedLinkedEntityType(link.entity_type, allowedTypes)) continue;",
    );
    expect(source).toContain(
      "appendLinkedEntityId(grouped, link.entity_type, link.entity_id);",
    );
    expect(source).not.toContain("grouped[type] ??=");
    expect(source).not.toContain("grouped[type]?.add");
    expect(source).not.toContain("link.entity_type as SearchLinkedEntityType");
  });

  it("resolves suggestion buckets through exhaustive explicit dispatch", () => {
    expect(source).toContain("function getSearchSuggestionsForBucket(");
    expect(source).toContain("case \"communities\":");
    expect(source).toContain("case \"businesses\":");
    expect(source).toContain("case \"professionals\":");
    expect(source).toContain("case \"opportunities\":");
    expect(source).toContain("case \"classifieds\":");
    expect(source).toContain("case \"events\":");
    expect(source).toContain("case \"posts\":");
    expect(source).not.toContain("SEARCH_SUGGESTIONS_BY_BUCKET[bucket]");
  });
});
