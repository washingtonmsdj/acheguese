import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("public shell admin boundary", () => {
  it("keeps AppSidebar free from admin site settings calls", () => {
    const source = readProjectFile("src/app/components/navigation/AppSidebar.tsx");

    expect(source).not.toContain("@/core/admin/hooks/useSiteSettings");
    expect(source).not.toContain("useSiteSettings");
    expect(source).not.toContain("admin-site-settings-rpc");
  });
});
