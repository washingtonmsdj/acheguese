import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const privacyService = readFileSync(
  join(root, "src/core/privacy/services/PrivacyService.ts"),
  "utf8",
);
const privacySettingsService = readFileSync(
  join(root, "src/core/privacy/services/PrivacySettingsService.ts"),
  "utf8",
);
const privacyRpcService = readFileSync(
  join(root, "src/core/privacy/services/PrivacyRpcService.ts"),
  "utf8",
);
const protectedRoute = readFileSync(
  join(root, "src/core/routing/components/ProtectedRoute.tsx"),
  "utf8",
);

describe("LGPD pending deletion client boundary", () => {
  it("removes the destructive legacy delete handler from active privacy services", () => {
    expect(privacyService).not.toContain('functions.invoke("user-delete-account"');
    expect(privacySettingsService).not.toContain(
      'buildSupabaseFunctionUrl("user-delete-account"',
    );
    expect(privacyService).toContain(
      "PrivacyRpcService.requestAccountDeletion",
    );
    expect(privacySettingsService).toContain(
      "PrivacyRpcService.requestAccountDeletion",
    );
  });

  it("uses the reversible privacy broker as the deletion status authority", () => {
    expect(privacySettingsService).not.toContain(
      '.from("user_deletion_schedule")',
    );
    expect(privacySettingsService).toContain(
      "PrivacyRpcService.getDeletionStatus()",
    );
    expect(privacySettingsService).toContain('"failed"');
  });

  it("keeps broker failures distinguishable from a clean no-request state", () => {
    expect(privacyRpcService).toContain("invokeSupabaseBroker");
    expect(privacyRpcService).not.toContain("invokeNullableSupabaseBroker");
    expect(privacyRpcService).toContain(
      "this.invoke<AccountDeletionStatusBrokerData | null>",
    );
  });

  it("fails closed while account status is loading, refreshing, or unavailable", () => {
    expect(protectedRoute).toContain(
      "deletionStatusQuery.isPending || deletionStatusQuery.isFetching",
    );
    expect(protectedRoute).toContain("deletionStatusQuery.isError");
    expect(protectedRoute).toContain('to={PRIVACY_ACCOUNT_PATH}');
    expect(protectedRoute).toContain('refetchOnMount: "always"');
    expect(protectedRoute).toContain("staleTime: 0");
  });

  it("keeps only the privacy recovery surface outside the deletion-status gate", () => {
    expect(protectedRoute).toContain(
      'const PRIVACY_ACCOUNT_PATH = "/conta/privacidade"',
    );
    expect(protectedRoute).toContain("!isPrivacySurface");
    expect(protectedRoute).toContain("if (isPrivacySurface)");
    for (const status of ["scheduled", "processing", "failed", "completed"]) {
      expect(protectedRoute).toContain(`"${status}"`);
    }
  });
});
