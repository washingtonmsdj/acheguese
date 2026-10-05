import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactPage = readFileSync("src/app/pages/ContactPage.tsx", "utf8");

describe("public ContactPage mailto boundary", () => {
  it("validates the configured contact email before rendering through SafeLink", () => {
    expect(contactPage).toContain('import { SafeLink } from "@/shared/components/security";');
    expect(contactPage).toContain("const contactEmailUrl = buildMailtoUrl(contactEmail);");
    expect(contactPage).toContain("<SafeLink");
    expect(contactPage).toContain("href={contactEmailUrl}");
    expect(contactPage).not.toContain("href={buildMailtoUrl(contactEmail) ?? undefined}");
  });
});
