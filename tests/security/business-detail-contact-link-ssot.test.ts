import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const businessDetail = readFileSync(
  "src/modules/business/company/pages/TerritoryBusinessDetail.tsx",
  "utf8",
);

describe("TerritoryBusinessDetail contact URL safety", () => {
  it("delegates external contact URLs to the shared validated builders", () => {
    expect(businessDetail).toContain("buildWebsiteUrl(value) ?? undefined");
    expect(businessDetail).toContain("buildInstagramUrl(value)");
    expect(businessDetail).toContain("buildFacebookUrl(value)");
    expect(businessDetail).toContain("buildWhatsAppUrl(value) ?? undefined");

    expect(businessDetail).not.toContain(
      'if (/^https?:\\/\\//i.test(value)) return value;',
    );
    expect(businessDetail).not.toContain("cleaned.includes(`${network}.com`)");
    expect(businessDetail).not.toContain(
      'return `https://${network}.com/${handle}`;',
    );
  });
});
