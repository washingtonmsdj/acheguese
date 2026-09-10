import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const service = readFileSync(
  join(root, "src/core/auth/services/MFAService.ts"),
  "utf8",
);
const hook = readFileSync(
  join(root, "src/core/auth/hooks/useMFA.ts"),
  "utf8",
);
const sessionRpc = readFileSync(
  join(root, "supabase/functions/session-rpc/index.ts"),
  "utf8",
);
const mfaPolicy = readFileSync(
  join(root, "supabase/functions/_shared/mfaPolicy.ts"),
  "utf8",
);
const adminAuth = readFileSync(
  join(root, "supabase/functions/_shared/adminAuth.ts"),
  "utf8",
);

describe("MFA Auth authority G42", () => {
  it("derives enabled MFA from Supabase Auth factors instead of the browser tracker", () => {
    expect(service).toContain("supabase.auth.mfa.listFactors()");
    expect(service).toContain("hasVerifiedTotp");
    expect(service).not.toContain("mfaEnabled: data.mfa_enabled");
    expect(service).not.toContain("generateBackupCodes");
    expect(service).not.toContain("backupCodes:");
  });

  it("does not let the browser mutate MFA authority metadata", () => {
    expect(service).not.toContain(".from('user_mfa_status')\n          .upsert(");
    expect(service).not.toContain(".from('user_mfa_status')\n          .update(");
    expect(service).not.toContain(".from('user_mfa_status')\n            .insert(");
    expect(service).toContain("reconcilePolicyTracker");
    expect(service).toContain("SessionRpcService.checkMfaRequired()");
  });

  it("centralizes role, verified-factor and current-AAL policy on the server", () => {
    expect(mfaPolicy).toContain('supabaseAdmin.rpc(\n    "get_user_roles"');
    expect(mfaPolicy).toContain('.from("admin_mfa_enforcement")');
    expect(mfaPolicy).toContain("supabaseAdmin.auth.admin.mfa.listFactors({");
    expect(mfaPolicy).toContain('factor.status === "verified"');
    expect(mfaPolicy).toContain("getAuthenticatorAssuranceLevel(token)");
    expect(mfaPolicy).toContain('reason: "enrollment_required"');
    expect(mfaPolicy).toContain('reason: "verification_required"');
    expect(mfaPolicy).toContain('currentLevel !== "aal2"');
  });

  it("uses the same MFA policy for UI state and every shared admin authorization", () => {
    expect(sessionRpc).toContain(
      'import { evaluateUserMfaPolicy } from "../_shared/mfaPolicy.ts"',
    );
    expect(sessionRpc).toContain("const policy = await evaluateUserMfaPolicy(");
    expect(sessionRpc).toContain("required: policy.required");
    expect(adminAuth).toContain(
      "const mfaPolicy = await evaluateUserMfaPolicy(supabase, user.id, token)",
    );
    expect(adminAuth).toContain("if (mfaPolicy.required)");
    expect(adminAuth).toContain("MFA enrollment required");
    expect(adminAuth).toContain("MFA verification required");
  });

  it("keeps an unresolved authenticated MFA policy fail closed", () => {
    expect(service).toContain("throw new Error('session-rpc returned no MFA requirement')");
    expect(service).not.toContain(
      "catch (error) {\n      logger.error('MFAService.checkMFARequired', error);\n      return { required: false",
    );
    expect(hook).toContain("setRequirement(null)");
    expect(hook).toContain("isMFARequired: requirement?.required ?? true");
    expect(hook).toContain("isMFARequirementResolved");
  });
});
