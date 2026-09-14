import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const privacyRpc = readFileSync(
  join(process.cwd(), "supabase/functions/privacy-rpc/index.ts"),
  "utf8",
);

describe("privacy deletion cancellation authentication boundary", () => {
  it("clears only legacy deletion metadata after a successful cancellation", () => {
    expect(privacyRpc).toContain("delete userMetadata.account_status;");
    expect(privacyRpc).toContain("delete userMetadata.deletion_requested_at;");
    expect(privacyRpc).toContain("delete userMetadata.scheduled_purge_at;");
    expect(privacyRpc).toContain("delete userMetadata.deletion_reason;");
    expect(privacyRpc).toContain("user_metadata: userMetadata");
  });

  it("does not promote email verification as a side effect of privacy recovery", () => {
    expect(privacyRpc).not.toContain("email_confirm: true");
    expect(privacyRpc).toContain(
      "Email\n  // verification is an independent authentication fact and must not be changed.",
    );
  });
});
