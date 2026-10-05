import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const LEGACY_CANONICAL_OWNERS = [
  "src/shared/components/seo/CanonicalUrl.tsx",
  "src/shared/components/seo/SEOHead.tsx",
] as const;

describe("legacy SEO canonical owners", () => {
  it("keeps retired parallel canonical components out of the runtime tree", () => {
    for (const file of LEGACY_CANONICAL_OWNERS) {
      expect(existsSync(file), file).toBe(false);
    }
  });
});
