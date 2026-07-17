import { describe, expect, it } from "vitest";

import {
  COMMUNITY_GUIDELINES,
  COMMUNITY_GUIDELINES_PATH,
  hasCurrentTermsAcceptance,
  isCurrentTermsAcceptance,
  TERMS_OF_SERVICE_VERSION,
} from "./termsOfService";

describe("termsOfService", () => {
  it("keeps community guidelines inside the canonical Terms document", () => {
    expect(COMMUNITY_GUIDELINES_PATH).toBe("/termos#diretrizes-da-comunidade");
    expect(COMMUNITY_GUIDELINES).toHaveLength(6);
    expect(
      new Set(COMMUNITY_GUIDELINES.map((guideline) => guideline.id)).size,
    ).toBe(COMMUNITY_GUIDELINES.length);
  });

  it("accepts only the current versioned terms contract", () => {
    expect(
      isCurrentTermsAcceptance({
        accepted: true,
        version: TERMS_OF_SERVICE_VERSION,
      }),
    ).toBe(true);
    expect(
      isCurrentTermsAcceptance({ accepted: true, version: "2026-01-01" }),
    ).toBe(false);
    expect(
      hasCurrentTermsAcceptance({
        consent_type: "terms_of_service",
        granted: true,
        terms_version: TERMS_OF_SERVICE_VERSION,
      }),
    ).toBe(true);
    expect(
      hasCurrentTermsAcceptance({
        consent_type: "terms_of_service",
        granted: true,
        terms_version: "1.0",
      }),
    ).toBe(false);
  });
});
