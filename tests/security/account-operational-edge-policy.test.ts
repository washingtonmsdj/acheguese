import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadAccountOperationalEdgePolicy,
  validateAccountOperationalEdgeCoverage,
} from "../../scripts/security/account-operational-edge-policy.mjs";

const root = process.cwd();
const authPolicy = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
    ),
    "utf8",
  ),
);
const operationalPolicyPath = join(
  root,
  "docs/09-reference/governance/security/ACCOUNT_OPERATIONAL_EDGE_POLICY.json",
);
const operationalPolicy = loadAccountOperationalEdgePolicy(operationalPolicyPath);

function loadServiceRoleFunctionContents(): Map<string, string> {
  const functionsRoot = join(root, "supabase/functions");
  const result = new Map<string, string>();

  for (const functionName of Object.keys(authPolicy.serviceRoleAllowlist)) {
    const path = join(functionsRoot, functionName, "index.ts");
    result.set(functionName, readFileSync(path, "utf8"));
  }

  return result;
}

describe("account operational Edge boundary", () => {
  it("classifies every service-role broker and leaves zero unguarded user brokers", () => {
    const result = validateAccountOperationalEdgeCoverage({
      authPolicy,
      operationalPolicy,
      serviceRoleFunctionContents: loadServiceRoleFunctionContents(),
    });

    expect(result.issues).toEqual([]);

    const modes = Object.fromEntries(result.modes.entries());
    expect(modes["privacy-rpc"]).toBe("allowed-during-deletion");
    expect(modes["user-export-data"]).toBe("allowed-during-deletion");
    expect(modes["user-delete-account"]).toBe("blocked-legacy");

    const guarded = Object.entries(modes)
      .filter(([, mode]) => mode === "guarded")
      .map(([name]) => name)
      .sort();
    expect(guarded.length).toBeGreaterThan(0);

    const guardPattern = new RegExp(operationalPolicy.guardPattern);
    for (const functionName of guarded) {
      const source = readFileSync(
        join(root, "supabase/functions", functionName, "index.ts"),
        "utf8",
      );
      expect(guardPattern.test(source)).toBe(true);
    }
  });

  it("keeps recovery/export exceptions narrow and versioned", () => {
    expect(Object.keys(operationalPolicy.allowedDuringDeletion).sort()).toEqual([
      "privacy-rpc",
      "user-export-data",
    ]);
    expect(Object.keys(operationalPolicy.blockedLegacy)).toEqual([
      "user-delete-account",
    ]);
  });

  it("uses the shared fail-closed helper as the only operational-state implementation", () => {
    const helper = readFileSync(
      join(root, "supabase/functions/_shared/accountOperational.ts"),
      "utf8",
    );
    expect(helper).toContain('.from("account_deletion_requests")');
    expect(helper).toContain('.select("status")');
    expect(helper).toContain("ACCOUNT_PENDING_DELETION_READ_ONLY");
    expect(helper).toContain("Account state unavailable");

    const businessAuth = readFileSync(
      join(root, "supabase/functions/_shared/businessAuth.ts"),
      "utf8",
    );
    expect(businessAuth).toContain("requireOperationalAccount");
    expect(businessAuth.indexOf("requireOperationalAccount(")).toBeGreaterThan(
      businessAuth.indexOf("supabase.auth.getUser(token)"),
    );

    const emergencyEmail = readFileSync(
      join(root, "supabase/functions/send-emergency-email/index.ts"),
      "utf8",
    );
    expect(emergencyEmail).toContain("requireAuthenticatedUser(req, supabase)");

    const sharedFiles = readdirSync(join(root, "supabase/functions/_shared"));
    expect(sharedFiles.filter((name) => name === "accountOperational.ts")).toEqual([
      "accountOperational.ts",
    ]);
  });
});
