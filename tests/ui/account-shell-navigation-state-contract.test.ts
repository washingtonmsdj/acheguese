import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const shell = readFileSync(
  resolve(root, "src/modules/profile/components/AccountSettingsShell.tsx"),
  "utf8",
);

describe("account settings navigation state contract", () => {
  it("matches account query state by parameter instead of exact query-string equality", () => {
    expect(shell).toContain("function matchesSearchConstraint");
    expect(shell).toContain("new URLSearchParams(locationSearch)");
    expect(shell).toContain("new URLSearchParams(constraint.startsWith");
    expect(shell).toContain("current.get(key) !== value");
    expect(shell).not.toContain("return locationSearch === search");
    expect(shell).not.toContain("locationSearch === excludeSearch");
  });

  it("keeps overview and managed profiles mutually exclusive", () => {
    expect(shell).toContain('excludeSearch: "?section=profiles"');
    expect(shell).toContain('search: "?section=profiles"');
    expect(shell).toContain("if (search && !matchesSearchConstraint(locationSearch, search)) return false");
    expect(shell).toContain("if (excludeSearch && matchesSearchConstraint(locationSearch, excludeSearch)) return false");
  });

  it("keeps nested security hashes assigned to the correct account section", () => {
    expect(shell).toContain('hashes: ["#acesso", "#email"]');
    expect(shell).toContain('excludeHashes: ["#acesso", "#email"]');
    expect(shell).toContain('["#senha", "#mfa"]');
  });
});
