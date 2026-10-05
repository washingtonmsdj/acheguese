import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/app/components/auth/InterestedCTAs.tsx",
  "utf8",
);

const LEGACY_VISUAL_TOKENS = [
  "border-primary",
  "bg-primary",
  "text-primary",
  "border-category-",
  "bg-category-",
  "text-category-",
  "border-border",
  "bg-card",
  "bg-background",
  "text-foreground",
  "text-muted-foreground",
  "ring-primary",
] as const;

describe("auth interest CTAs visual SSOT", () => {
  it("uses territorial semantic tones without legacy category palettes", () => {
    expect(source).toContain("territory-brand");
    expect(source).toContain("territory-info");
    expect(source).toContain("territory-sun");
    expect(source).toContain("territory-success");
    expect(source).toContain("territory-border");

    for (const token of LEGACY_VISUAL_TOKENS) {
      expect(source, `legacy InterestedCTAs visual token returned: ${token}`).not.toContain(token);
    }
  });

  it("preserves entry routes and centralizes institutional contact", () => {
    expect(source).toContain('href: "/interesse"');
    expect(source).toContain('href: "/empresas/nova"');
    expect(source).toContain("VITE_CONTACT_EMAIL");
    expect(source).toContain("buildMailtoUrl(contactEmail");
    expect(source).toContain("<SafeLink href={item.href}");
    expect(source).toContain('?? "/contato"');
    expect(source).not.toContain("parcerias@achegue-se.com.br");
    expect(source).not.toContain("contato@achegue-se.com.br");
    expect(source).not.toContain("<a href={item.href}");
  });
});
