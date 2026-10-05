import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "tests/e2e/business-lifecycle-authenticated.spec.ts"),
  "utf8",
);

describe("Business authenticated E2E cleanup boundary", () => {
  it("cleans Business fixtures through the canonical profile broker", () => {
    expect(source).toContain("invokeSupabaseBroker");
    expect(source).toContain('action: "deactivateBusiness"');
    expect(source).toContain('functionName: "profile-rpc"');
    expect(source).toContain("await deactivateBusinessFixture(client, business.profile_id)");
  });

  it("does not reopen direct browser writes to Business or Profile tables", () => {
    expect(source).not.toMatch(
      /\.from\(["']profiles["']\)[\s\S]{0,200}?\.update\(/,
    );
    expect(source).not.toMatch(
      /\.from\(["']business_data["']\)[\s\S]{0,200}?\.update\(/,
    );
  });
});
