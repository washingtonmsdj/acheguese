import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  ".github/workflows/supabase-track-public-view-deploy.yml",
  "utf8",
);

const config = readFileSync("supabase/config.toml", "utf8");
const broker = readFileSync(
  "supabase/functions/track-public-view/index.ts",
  "utf8",
);

describe("track-public-view exact-source deploy contract", () => {
  it("certifies pull-request head source without credentials or deployment", () => {
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("PR_HEAD_SHA: ${{ github.event.pull_request.head.sha }}");
    expect(workflow).toContain(
      "PR_HEAD_REPOSITORY: ${{ github.event.pull_request.head.repo.full_name }}",
    );
    expect(workflow).toContain('if ($env:GITHUB_EVENT_NAME -eq "pull_request")');
    expect(workflow).toContain('$targetMode = "pull-request-head"');
    expect(workflow).toContain("if: github.event_name != 'pull_request'");
  });

  it("deploys only immutable main source to the canonical Supabase project", () => {
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain('SUPABASE_PROJECT_REF: "xhdowzacfujckjelqhtd"');
    expect(workflow).toContain('SUPABASE_CLI_VERSION: "2.115.0"');
    expect(workflow).toContain('if ($env:EVENT_REF -ne "refs/heads/main")');
    expect(workflow).toContain('$targetMode = "main"');
    expect(workflow).toContain("ref: ${{ steps.target.outputs.sha }}");
    expect(workflow).toContain("Assert checkout provenance");
    expect(workflow).toContain("Deploy track-public-view from exact checkout");
    expect(workflow).toContain("functions deploy track-public-view");
    expect(workflow).toContain("--project-ref $env:SUPABASE_PROJECT_REF");
    expect(workflow).toContain("--use-api");
  });

  it("includes every source owner that can change the deployed broker bundle", () => {
    expect(workflow).toContain('"supabase/functions/track-public-view/**"');
    expect(workflow).toContain('"supabase/functions/_shared/security.ts"');
    expect(workflow).toContain('"supabase/functions/_shared/validation.ts"');
    expect(workflow).toContain('"supabase/config.toml"');
    expect(workflow).toContain(
      '".github/workflows/supabase-track-public-view-deploy.yml"',
    );

    expect(workflow).toContain(
      '"supabase/functions/track-public-view/index.ts"',
    );
    expect(workflow).toContain(
      '"supabase/functions/_shared/security.ts"',
    );
    expect(workflow).toContain(
      '"supabase/functions/_shared/validation.ts"',
    );
  });

  it("keeps the deliberately public broker fail-closed around explicit dispatch", () => {
    expect(config).toMatch(
      /\[functions\.track-public-view\][\s\S]*?verify_jwt\s*=\s*false/,
    );
    expect(broker).toContain("publicViewEventSchema");
    expect(broker).toContain("rateLimitMiddleware(req, 120, 60_000)");
    expect(broker).toContain("supabaseAdmin.rpc(functionName, rpcArgs)");
    expect(broker).not.toContain("VIEW_COUNTER_RPCS");
    expect(broker).not.toContain("[counterRpc.argName]");

    expect(workflow).toContain("publicViewEventSchema");
    expect(workflow).toContain("rateLimitMiddleware(req, 120, 60_000)");
    expect(workflow).toContain("supabaseAdmin.rpc(functionName, rpcArgs)");
    expect(workflow).toContain("VIEW_COUNTER_RPCS");
    expect(workflow).toContain("legacy dynamic dispatch returned");
  });

  it("verifies the remote broker remains active with the intended JWT mode", () => {
    expect(workflow).toContain("Verify remote broker inventory");
    expect(workflow).toContain("$broker[0].verify_jwt -ne $false");
    expect(workflow).toContain("$broker[0].status -ne \"ACTIVE\"");
    expect(workflow).toContain("REMOTE_TRACK_PUBLIC_VIEW");
  });
});
