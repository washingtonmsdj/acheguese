import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/ssot-tests.yml", "utf8");

describe("authenticated release public Supabase env", () => {
  it("provides the app runtime and E2E harness with the same canonical public Supabase endpoint", () => {
    const job = workflow.match(
      /authenticated_account_e2e:[\s\S]*?\n  regression-check:/,
    )?.[0];

    expect(job).toBeTruthy();
    expect(job).toContain(
      "E2E_SUPABASE_URL: https://xhdowzacfujckjelqhtd.supabase.co",
    );
    expect(job).toContain(
      "VITE_SUPABASE_URL: https://xhdowzacfujckjelqhtd.supabase.co",
    );
    expect(job).toContain(
      "E2E_SUPABASE_PUBLISHABLE_KEY: sb_publishable_dc-rd2YjKuZ5KJc_zRYVYA_ANmcFxKk",
    );
    expect(job).toContain(
      "VITE_SUPABASE_PUBLISHABLE_KEY: sb_publishable_dc-rd2YjKuZ5KJc_zRYVYA_ANmcFxKk",
    );
    expect(job).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(job).not.toContain("SUPABASE_SECRET_KEY");
  });
});
