import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactLink = readFileSync(
  "src/modules/business/components/ContactLink.tsx",
  "utf8",
);

describe("business ContactLink security SSOT", () => {
  it("uses shared contact builders and SafeLink for dynamic values", () => {
    expect(contactLink).toContain("buildTelUrl(value)");
    expect(contactLink).toContain("buildMailtoUrl(value)");
    expect(contactLink).toContain("buildWebsiteUrl(value)");
    expect(contactLink).toContain("<SafeLink");
    expect(contactLink).not.toContain("`tel:${value}`");
    expect(contactLink).not.toContain("`mailto:${value}`");
    expect(contactLink).not.toContain("<a\n      href={getHref()}");
  });
});
