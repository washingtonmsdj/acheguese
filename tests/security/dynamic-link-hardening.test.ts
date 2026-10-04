import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminDataQuality = readFileSync(
  "src/modules/admin/pages/AdminDataQuality.tsx",
  "utf8",
);
const businessActionButton = readFileSync(
  "src/modules/business/company/components/ctas/ActionButton.tsx",
  "utf8",
);

describe("dynamic link hardening", () => {
  it("routes administrator-provided source URLs through SafeLink", () => {
    expect(adminDataQuality).toContain(
      'import { SafeLink } from "@/shared/components/security/SafeLink";',
    );
    expect(adminDataQuality).toContain("<SafeLink");
    expect(adminDataQuality).toContain("href={item.source_url}");
    expect(adminDataQuality).not.toContain("<a\n                          href={item.source_url}");
  });

  it("routes public business CTA href values through SafeLink", () => {
    expect(businessActionButton).toContain(
      "import { SafeLink } from '@/shared/components/security/SafeLink';",
    );
    expect(businessActionButton).toContain('<SafeLink href={href} target="_blank"');
    expect(businessActionButton).not.toContain('<a href={href} target="_blank"');
  });
});
