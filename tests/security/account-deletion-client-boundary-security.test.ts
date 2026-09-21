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
const privacyRollout = readFileSync(
  join(root, "src/core/privacy/config/privacyRollout.ts"),
  "utf8",
);
const privacyPage = readFileSync(
  join(root, "src/app/pages/PrivacySettingsPage.tsx"),
  "utf8",
);
const productionEnv = readFileSync(join(root, ".env.production"), "utf8");

describe("LGPD pending deletion client boundary", () => {
  it("removes the destructive legacy delete handler from active privacy services", () => {
    expect(privacyService).not.toContain('functions.invoke("user-delete-account"');
    expect(privacySettingsService).not.toContain(
      'buildSupabaseFunctionUrl("user-delete-account"',
    );
    expect(privacyService).not.toContain(
      "PrivacyRpcService.requestAccountDeletion",
    );
    expect(privacyService).not.toContain("static async deleteAccount(");
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

  it("serializes account-deletion mutations by session and intent", () => {
    expect(privacySettingsService).toContain(
      "private static accountDeletionMutationInFlight: AccountDeletionMutation | null = null;",
    );
    expect(privacySettingsService).toContain(
      'activeMutation.kind === "request"',
    );
    expect(privacySettingsService).toContain(
      "activeMutation.accessToken === input.accessToken",
    );
    expect(privacySettingsService).toContain(
      "activeMutation.reason === reason",
    );
    expect(privacySettingsService).toContain(
      'activeMutation.kind === "cancel"',
    );
    expect(privacySettingsService).toContain(
      "activeMutation.accessToken === accessToken",
    );
    expect(privacySettingsService).toContain(
      'throw new Error("Ja existe uma operacao de exclusao em andamento")',
    );
    expect(privacySettingsService).toContain(
      "if (currentMutation?.promise === operation)",
    );
  });

  it("deduplicates exports only inside the same authenticated session", () => {
    expect(privacySettingsService).toContain(
      "private static exportInFlight:",
    );
    expect(privacySettingsService).toContain(
      "if (activeExport.accessToken === accessToken)",
    );
    expect(privacySettingsService).toContain("return activeExport.promise;");
    expect(privacySettingsService).toContain(
      'throw new Error("Ja existe uma exportacao de outra sessao em andamento")',
    );
    expect(privacySettingsService).toContain(
      "if (this.exportInFlight?.promise === operation)",
    );
  });

  it("binds export and deletion requests to the still-current session token", () => {
    expect(privacySettingsService).toContain(
      "private static assertCurrentSessionAccessToken(accessToken: string): void",
    );
    expect(privacySettingsService).toContain(
      "const currentAccessToken = SessionService.getAccessToken();",
    );
    expect(privacySettingsService).toContain(
      "currentAccessToken !== accessToken",
    );
    expect(privacySettingsService).toContain(
      "this.assertCurrentSessionAccessToken(accessToken);",
    );
    expect(privacySettingsService).toContain(
      "this.assertCurrentSessionAccessToken(input.accessToken);",
    );
  });

  it("normalizes the deletion reason before deduplicating and forwarding it", () => {
    const normalization = privacySettingsService.indexOf(
      "const reason = input.reason.trim();",
    );
    const mutation = privacySettingsService.indexOf(
      "PrivacyRpcService.requestAccountDeletion({",
      normalization,
    );

    expect(normalization).toBeGreaterThanOrEqual(0);
    expect(mutation).toBeGreaterThan(normalization);
    expect(privacySettingsService).toContain("reason,");
  });
  it("keeps new account-deletion requests fail-closed until purge rollout is certified", () => {
    expect(privacyRollout).toContain(
      "PRIVACY_ACCOUNT_DELETION_RELEASE_CERTIFIED = false",
    );
    expect(privacyRollout).toContain(
      'import.meta.env.VITE_FEATURE_PRIVACY_ACCOUNT_DELETION === "true"',
    );
    expect(productionEnv).toMatch(
      /^VITE_FEATURE_PRIVACY_ACCOUNT_DELETION=false$/m,
    );
    expect(privacySettingsService).toContain(
      "assertPrivacyAccountDeletionEnabled();",
    );
    expect(privacySettingsService).toContain(
      "static isAccountDeletionRequestAvailable(): boolean",
    );
    expect(privacyPage).toContain(
      "PrivacySettingsService.isAccountDeletionRequestAvailable()",
    );
    expect(privacyPage).toContain("deletionRequestAvailable ? (");
    expect(privacyPage).toContain(
      "Exclusão automática temporariamente indisponível",
    );
    expect(privacyPage).toContain(
      "Essa data não confirma processamento automático.",
    );
  });

});
