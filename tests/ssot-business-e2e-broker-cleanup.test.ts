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

  it("keeps Profile entirely behind its broker boundary", () => {
    expect(source).not.toMatch(/\.from\(["']profiles["']\)/);
  });

  it("keeps business_data direct access read-only in this E2E", () => {
    expect(source).toContain('.from("business_data")');
    for (const mutation of ["insert", "update", "upsert", "delete"]) {
      expect(source).not.toMatch(
        new RegExp(
          `\\.from\\(["']business_data["']\\)[\\s\\S]{0,240}?\\.${mutation}\\(`,
        ),
      );
    }
  });
});
