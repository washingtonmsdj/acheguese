import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const service = readFileSync(
  join(root, "src/core/auth/services/AuthIdentityService.ts"),
  "utf8",
);
const sessionService = readFileSync(
  join(root, "src/core/session/services/SessionService.ts"),
  "utf8",
);
const hook = readFileSync(
  join(root, "src/core/auth/hooks/useLinkedAuthProviders.ts"),
  "utf8",
);
const securityPage = readFileSync(
  join(root, "src/modules/profile/pages/ContaSegurancaPage.tsx"),
  "utf8",
);

describe("linked auth provider authority", () => {
  it("requires a server-verified session authority before interpreting linked identities", () => {
    expect(service).toContain("SessionService.getVerifiedAuthUser()");
    expect(service).toContain("if (!user)");
    expect(service).toContain(
      'throw new Error("Authenticated user unavailable while reading linked providers")',
    );
    expect(service).toContain("user.identities");
    expect(service).not.toContain("supabase.auth.");
    expect(sessionService).toContain("static async getVerifiedAuthUser");
    expect(sessionService).toContain("supabase.auth.getUser()");
  });

  it("keeps provider linkage unresolved while loading or after an authority failure", () => {
    expect(hook).toContain("useState<LinkedAuthProviders | null>(null)");
    expect(hook).toContain("setData(null)");
    expect(hook).toContain("isResolved: data !== null && error === null");
    expect(hook).not.toContain("setData(EMPTY_PROVIDERS);");
  });

  it("publishes only the newest linked-provider refresh and invalidates reads on unmount", () => {
    expect(hook).toContain("const mountedRef = useRef(true);");
    expect(hook).toContain("const refreshRequestIdRef = useRef(0);");
    expect(hook).toContain(
      "const requestId = refreshRequestIdRef.current + 1;",
    );
    expect(hook).toContain("refreshRequestIdRef.current = requestId;");
    expect(hook).toContain("requestId !== refreshRequestIdRef.current");
    expect(hook).toContain("mountedRef.current = false;");
    expect(hook).toContain("refreshRequestIdRef.current += 1;");
    expect(hook).toContain("requestId === refreshRequestIdRef.current");
  });

  it("does not present an unresolved Google linkage as available or disconnected", () => {
    expect(securityPage).toContain("isResolved: providersResolved");
    expect(securityPage).toContain(
      "const providersUnknown = providersError !== null || !providersResolved;",
    );
    expect(securityPage).toContain('providersUnknown\n        ? "Não confirmado"');
    expect(securityPage).toContain(
      'providersUnknown\n        ? "Não foi possível confirmar agora se uma identidade Google está vinculada."',
    );
  });
});
