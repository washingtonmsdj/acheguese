import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const header = readFileSync(
  "src/modules/central/components/CentralHeader.tsx",
  "utf8",
);

describe("CentralHeader public link boundary", () => {
  it("routes the canonical public absolute URL through SafeLink", () => {
    expect(header).toContain('import { SafeLink } from "@/shared/components/security";');
    expect(header).toContain('const publicHomeUrl = buildPublicAbsoluteUrl("/");');
    expect(header).toContain("<SafeLink");
    expect(header).toContain("href={publicHomeUrl}");
    expect(header).not.toContain("<a\n          href={publicHomeUrl}");
  });
});
