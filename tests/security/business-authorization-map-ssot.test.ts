import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const map = JSON.parse(
  readFileSync(
    resolve(root, "docs/03-architecture/authorization-enforcement-map.json"),
    "utf8",
  ),
) as {
  actions: Array<{
    action: string;
    commandOwner: string;
    enforcement: string[];
    evidence: string[];
  }>;
};

const expected = new Map([
  ["createBusiness", "service-role-only-rpc:profile_rpc_create_business"],
  ["editBusiness", "service-role-only-rpc:profile_rpc_update_business"],
  ["deleteBusiness", "service-role-only-rpc:profile_rpc_deactivate_business"],
]);

describe("Business authorization enforcement SSOT", () => {
  it("keeps Business lifecycle commands behind the profile-rpc broker", () => {
    for (const [actionName, rpc] of expected) {
      const action = map.actions.find((entry) => entry.action === actionName);
      expect(action, actionName).toBeDefined();
      expect(action?.commandOwner).toBe(
        "src/core/business/services/business.mutations.ts",
      );
      expect(action?.enforcement).toContain("edge-function:profile-rpc");
      expect(action?.enforcement).toContain(rpc);
      expect(action?.enforcement).toContain("actor-binding:authenticated-user");
      expect(action?.evidence).toContain("supabase/functions/profile-rpc/index.ts");
      expect(action?.evidence).toContain(
        "tests/security/business-data-grants-security.test.ts",
      );
      expect(action?.evidence).toContain(
        "tests/security/profile-rpc-security.test.ts",
      );
    }
  });

  it("does not regress Business lifecycle enforcement to legacy direct-write RLS policies", () => {
    const businessActions = map.actions.filter((entry) =>
      expected.has(entry.action),
    );
    const enforcement = businessActions.flatMap((entry) => entry.enforcement);

    expect(enforcement).not.toContain("rls:Owners manage own business");
    expect(enforcement).not.toContain("rls:Profile members manage business");
    expect(enforcement).not.toContain("rls:Managers can modify business data");
  });
});
