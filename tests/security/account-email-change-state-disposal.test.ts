import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const securityPage = readFileSync(
  resolve(root, "src/modules/profile/pages/ContaSegurancaPage.tsx"),
  "utf8",
);

describe("account email change state disposal", () => {
  it("clears local email-change state when leaving the dedicated hash view", () => {
    expect(securityPage).toContain("const emailUpdateRequestIdRef = useRef(0);");
    expect(securityPage).toContain('if (location.hash === "#email") return;');
    expect(securityPage).toContain("emailUpdateRequestIdRef.current += 1;");
    expect(securityPage).toContain('setNewEmail("");');
    expect(securityPage).toContain("setEmailError(null);");
    expect(securityPage).toContain("setUpdatingEmail(false);");
    expect(securityPage).toContain("setEmailRequestSent(false);");
  });

  it("invalidates email requests when the security page unmounts", () => {
    expect(securityPage).toContain("const mountedRef = useRef(true);");
    expect(securityPage).toContain("mountedRef.current = false;");
    expect(securityPage).toContain("emailUpdateRequestIdRef.current += 1;");
    expect(securityPage).toContain(
      "currentLocationPathRef.current === ACCOUNT_PATHS.security",
    );
    expect(securityPage).toContain(
      "const isCurrentSecurityView = (hash: string) =>",
    );
  });

  it("invalidates an in-flight request before it can publish stale success or error UI", () => {
    const handler = securityPage.indexOf("const handleUpdateEmail = async () => {");
    const requestId = securityPage.indexOf(
      "const requestId = emailUpdateRequestIdRef.current + 1;",
      handler,
    );
    const updateCall = securityPage.indexOf("await updateEmail(candidate);", requestId);
    const staleGuard = securityPage.indexOf(
      '!isCurrentSecurityView("#email")',
      updateCall,
    );
    const successState = securityPage.indexOf("setEmailRequestSent(true);", updateCall);
    const successToast = securityPage.indexOf(
      'toast.success("Alteração de e-mail solicitada"',
      updateCall,
    );
    const catchBlock = securityPage.indexOf("} catch (error) {", successToast);
    const catchGuard = securityPage.indexOf(
      '!isCurrentSecurityView("#email")',
      catchBlock,
    );
    const errorState = securityPage.indexOf("setEmailError(message);", catchGuard);

    expect(handler).toBeGreaterThanOrEqual(0);
    expect(requestId).toBeGreaterThan(handler);
    expect(updateCall).toBeGreaterThan(requestId);
    expect(staleGuard).toBeGreaterThan(updateCall);
    expect(successState).toBeGreaterThan(staleGuard);
    expect(successToast).toBeGreaterThan(successState);
    expect(catchGuard).toBeGreaterThan(catchBlock);
    expect(errorState).toBeGreaterThan(catchGuard);
  });

  it("only clears the loading flag while the same email view still owns the request", () => {
    const handler = securityPage.indexOf("const handleUpdateEmail = async () => {");
    const finallyBlock = securityPage.indexOf("} finally {", handler);
    const generationGuard = securityPage.indexOf(
      "requestId === emailUpdateRequestIdRef.current &&",
      finallyBlock,
    );
    const routeGuard = securityPage.indexOf(
      'isCurrentSecurityView("#email")',
      generationGuard,
    );
    const clearLoading = securityPage.indexOf(
      "setUpdatingEmail(false);",
      routeGuard,
    );

    expect(finallyBlock).toBeGreaterThan(handler);
    expect(generationGuard).toBeGreaterThan(finallyBlock);
    expect(routeGuard).toBeGreaterThan(generationGuard);
    expect(clearLoading).toBeGreaterThan(routeGuard);
  });
});
