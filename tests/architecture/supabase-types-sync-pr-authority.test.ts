import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/supabase-types-sync.yml"),
  "utf8",
);

describe("Supabase Types Sync publication authority", () => {
  it("never writes generated types directly to main", () => {
    expect(workflow).not.toContain("git push origin HEAD:main");
    expect(workflow).not.toContain('git push origin "HEAD:main"');
    expect(workflow).not.toContain("Apply generated types to latest main");
  });

  it("publishes drift through one automation-owned pull request branch", () => {
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('actions: write');
    expect(workflow).toContain('SYNC_BRANCH: "automation/supabase-types-sync"');
    expect(workflow).toContain("gh pr create --base main");
    expect(workflow).toContain("--head $env:SYNC_BRANCH");
    expect(workflow).toContain("--force-with-lease");
  });

  it("dispatches executable source gates for the generated head branch", () => {
    for (const gate of [
      "security-check.yml",
      "security-scan.yml",
      "ssot-enforcement.yml",
      "ssot-tests.yml",
    ]) {
      expect(workflow).toContain(gate);
    }
    expect(workflow).toContain(
      "gh workflow run $workflow --ref $env:SYNC_BRANCH",
    );
  });

  it("keeps the canonical generator and self-hosted remote-only authority", () => {
    expect(workflow).toContain("npm run generate:types");
    expect(workflow).toContain("acheguese-heavy-windows");
    expect(workflow).toContain("remote-only");
    expect(workflow).toContain(
      'TYPES_PATH: "src/integrations/supabase/types.generated.ts"',
    );
  });
});
