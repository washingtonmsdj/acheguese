import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const service = readFileSync(
  join(root, "src/core/auth/services/AuthIdentityService.ts"),
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
  it("requires an authenticated authority before interpreting linked identities", () => {
    expect(service).toContain("supabase.auth.getUser()");
    expect(service).toContain("if (!data.user)");
    expect(service).toContain(
      'throw new Error("Authenticated user unavailable while reading linked providers")',
    );
    expect(service).toContain("data.user.identities");
  });

  it("keeps provider linkage unresolved while loading or after an authority failure", () => {
    expect(hook).toContain("useState<LinkedAuthProviders | null>(null)");
    expect(hook).toContain("setData(null)");
    expect(hook).toContain("isResolved: data !== null && error === null");
    expect(hook).not.toContain("setData(EMPTY_PROVIDERS);");
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
