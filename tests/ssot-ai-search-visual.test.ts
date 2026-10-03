import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const BOX_PATH = "src/core/ai/components/AISearchBox.tsx";
const RESULTS_PATH = "src/core/ai/components/AISearchResults.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("AI search territory visual SSOT", () => {
  it("projects the search box through canonical territory tokens", () => {
    const box = read(BOX_PATH);

    for (const token of [
      "border-territory-border",
      "bg-territory-surface",
      "text-territory-muted",
      "text-territory-ink",
      "bg-territory-sun",
    ]) {
      expect(box).toContain(token);
    }

    for (const legacyUtility of [
      "border-border",
      "bg-background",
      "text-muted-foreground",
    ]) {
      expect(box).not.toContain(legacyUtility);
    }

    expect(box).toContain("onSubmit={submit}");
    expect(box).toContain("void onSearch(query)");
    expect(box).toContain('aria-label="Busca inteligente"');
    expect(box).toContain("loading || query.trim().length < 2");
  });

  it("projects search results through territory tokens without changing result contracts", () => {
    const results = read(RESULTS_PATH);

    for (const token of [
      "border-territory-border",
      "bg-territory-surface",
      "bg-territory-surface-raised",
      "text-territory-muted",
      "text-territory-ink",
      "hover:border-territory-brand/40",
    ]) {
      expect(results).toContain(token);
    }

    for (const legacyUtility of [
      "border-border",
      "bg-background",
      "bg-muted",
      "text-muted-foreground",
      "text-foreground",
      "hover:border-primary/40",
    ]) {
      expect(results).not.toContain(legacyUtility);
    }

    expect(results).toContain("AIActionResult");
    expect(results).toContain("result.items.map");
    expect(results).toContain("result.intent.type");
    expect(results).toContain("result.intent.confidence");
    expect(results).toContain("item.url ?");
    expect(results).toContain("<Link");
    expect(results).toContain("Intenção:");
    expect(results).not.toContain("Intent:");
  });
});
