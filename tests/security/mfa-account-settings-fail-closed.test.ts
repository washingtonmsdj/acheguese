import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const hook = readFileSync(
  join(root, "src/core/auth/hooks/useMFA.ts"),
  "utf8",
);
const service = readFileSync(
  join(root, "src/core/auth/services/MFAService.ts"),
  "utf8",
);
const securityPage = readFileSync(
  join(root, "src/modules/profile/pages/ContaSegurancaPage.tsx"),
  "utf8",
);

describe("account MFA settings fail-closed contract", () => {
  it("preserves factor lookup failure instead of turning it into an empty authority result", () => {
    expect(hook).toContain("setError('Não foi possível consultar os fatores de MFA')");
    expect(hook).toContain("return null;");
    expect(hook).not.toContain(
      "setError('Não foi possível consultar os fatores de MFA');\n      return [];",
    );
  });

  it("does not present unresolved MFA authority as disabled", () => {
    expect(securityPage).toContain("isMFAStatusResolved");
    expect(securityPage).toContain("isMFAStatusResolved && !isMFAEnabled");
    expect(securityPage).toContain("isMFAStatusResolved && isMFAEnabled");
    expect(securityPage).toContain("Indisponível");
    expect(securityPage).not.toContain("{!isMFAEnabled ? (");
  });

  it("blocks destructive and enrollment actions while factor authority is unknown", () => {
    expect(securityPage).toContain("if (factors === null)");
    expect(securityPage).toContain("Nenhuma alteração foi feita.");
    expect(securityPage).toContain("!isMFAStatusResolved ? (");
    expect(securityPage).toContain(
      "Nenhuma nova configuração será criada enquanto o serviço de autenticação estiver indisponível.",
    );
    expect(securityPage).toContain("Confirmando o estado de segurança da conta...");
  });

  it("drops the local enrollment secret and verification code when leaving the MFA view", () => {
    expect(securityPage).toContain("const mfaFlowRequestIdRef = useRef(0);");
    expect(securityPage).toContain('if (location.hash === "#mfa") return;');
    expect(securityPage).toContain("mfaFlowRequestIdRef.current += 1;");
    expect(securityPage).toContain("setEnrollment(null);");
    expect(securityPage).toContain('setVerificationCode("");');
    expect(securityPage).toContain("setVerifying(false);");
    expect(securityPage).toContain("setCancellingEnrollment(false);");
  });

  it("invalidates MFA async generations on unmount and before stale navigation or toasts", () => {
    expect(securityPage).toContain("mountedRef.current = false;");
    expect(securityPage).toContain("mfaFlowRequestIdRef.current += 1;");
    expect(securityPage).toContain(
      "requestId !== mfaFlowRequestIdRef.current ||",
    );
    expect(securityPage).toContain('!isCurrentSecurityView("#mfa")');

    const start = securityPage.indexOf("const handleStartMfa = async");
    const awaitEnrollment = securityPage.indexOf("await startEnrollment();", start);
    const startGuard = securityPage.indexOf(
      "requestId !== mfaFlowRequestIdRef.current ||",
      awaitEnrollment,
    );
    const startNavigate = securityPage.indexOf(
      "navigate(ACCOUNT_PATHS.mfa)",
      startGuard,
    );
    expect(start).toBeGreaterThanOrEqual(0);
    expect(awaitEnrollment).toBeGreaterThan(start);
    expect(startGuard).toBeGreaterThan(awaitEnrollment);
    expect(startNavigate).toBeGreaterThan(startGuard);
  });

  it("cleans abandoned unverified factors before creating the next enrollment", () => {
    expect(service).toContain("const abandonedFactors = totpFactors.filter(");
    expect(service).toContain("factor.status !== 'verified'");
    expect(service).toContain("await supabase.auth.mfa.unenroll({");
    expect(service).toContain("factorId: factor.id");
    expect(service.indexOf("abandonedFactors")).toBeLessThan(
      service.indexOf("supabase.auth.mfa.enroll({"),
    );
  });

  it("keeps implementation jargon out of the user-facing security surface", () => {
    expect(securityPage).not.toContain("códigos TOTP");
    expect(securityPage).not.toContain("fator TOTP");
    expect(securityPage).not.toContain("autoridade de fatores");
    expect(securityPage).toContain("aplicativo autenticador");
    expect(securityPage).toContain("serviço de autenticação");
  });
});
