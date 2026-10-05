import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactCard = readFileSync(
  "src/modules/business/company/components/info/ContactCard.tsx",
  "utf8",
);

describe("Business ContactCard link boundary", () => {
  it("routes validated email and phone actions through SafeLink", () => {
    expect(contactCard).toContain("const emailUrl = buildMailtoUrl(business.email);");
    expect(contactCard).toContain("const phoneUrl = buildTelUrl(business.phone);");
    expect(contactCard).toContain("href={emailUrl}");
    expect(contactCard).toContain("href={phoneUrl}");
    expect(contactCard.match(/<SafeLink/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(contactCard).not.toContain("<a\n              href={emailUrl}");
    expect(contactCard).not.toContain("<a\n                href={phoneUrl}");
  });
});
