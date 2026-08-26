import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

describe("release regression guard", () => {
  it("keeps public PWA and SEO assets versioned", () => {
    for (const file of [
      "public/manifest.json",
      "public/icon-192x192.png",
      "public/icon-512x512.png",
      "public/badge-72x72.png",
      "public/og-image.png",
    ]) {
      expect(existsSync(file), file).toBe(true);
    }
  });
});
