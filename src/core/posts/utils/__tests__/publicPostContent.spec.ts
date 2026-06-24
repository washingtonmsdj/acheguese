import { describe, expect, it } from "vitest";

import { getPublicPostPreview, normalizePublicPostContent } from "../publicPostContent";

describe("publicPostContent", () => {
  it("removes technical seed markers from public content", () => {
    expect(normalizePublicPostContent("[MOCK_FEED_SEED_V1] Bom dia, bairro!")).toBe("Bom dia, bairro!");
    expect(getPublicPostPreview("[MOCK_FEED_SEED_V1] Bom dia, bairro!", 80)).toBe("Bom dia, bairro!");
  });

  it("keeps regular bracketed user content", () => {
    expect(normalizePublicPostContent("[AVISO] Reuniao hoje")).toBe("[AVISO] Reuniao hoje");
  });

  it("uses fallback for empty content after sanitization", () => {
    expect(getPublicPostPreview("[MOCK_FEED_SEED_V1]", 80, "Publicacao local.")).toBe("Publicacao local.");
  });
});
