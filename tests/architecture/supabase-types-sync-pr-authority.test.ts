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
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('GITHUB_API_TOKEN: ${{ github.token }}');
    expect(workflow).toContain('-Path "/pulls"');
    expect(workflow).toContain('head = $env:SYNC_BRANCH');
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
      '-Path "/actions/workflows/$workflow/dispatches"',
    );
    expect(workflow).toContain('@{ ref = $env:SYNC_BRANCH }');
  });

  it("closes stale automation PRs when there is no generated drift", () => {
    expect(workflow).toContain('Get-OpenSyncPullRequest');
    expect(workflow).toContain('-Method "PATCH"');
    expect(workflow).toContain('@{ state = "closed" }');
    expect(workflow).toContain('git push origin --delete $env:SYNC_BRANCH');
  });

  it("does not depend on GitHub CLI being installed on the self-hosted runner", () => {
    expect(workflow).not.toMatch(/\bgh\s+(?:pr|workflow|api)\b/);
    expect(workflow).toContain("Invoke-RestMethod");
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
