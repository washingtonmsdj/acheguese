import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 transactional Business network authority", () => {
  it("routes structural network mutations through a JWT broker", () => {
    const edge = read("supabase/functions/business-network-rpc/index.ts");
    const service = read(
      "src/core/business/services/BusinessNetworkRpcService.ts",
    );
    const network = read("src/core/business/services/NetworkService.ts");

    expect(edge).toContain("requireOperationalAccount");
    expect(edge).toContain("p_actor_user_id: auth.userId");
    expect(edge).not.toMatch(/p_actor_user_id:\s*params\./);
    expect(service).toContain('const FUNCTION_NAME = "business-network-rpc"');
    expect(network).toContain("BusinessNetworkRpcService.convertToNetwork");
    expect(network).toContain("BusinessNetworkRpcService.createBranch");
    expect(network).toContain("BusinessNetworkRpcService.setHeadquarters");
  });

  it("does not turn successful network commands into read-after-write failures", () => {
    const network = read("src/core/business/services/NetworkService.ts");

    expect(network).toContain(
      "return BusinessNetworkRpcService.createBranch(params);",
    );
    expect(network).not.toContain(
      "Filial criada, mas a leitura do registro falhou",
    );
    expect(network).not.toContain("getBrandHub(");
    expect(network).not.toContain("getParentBrandHub(");
    expect(network).not.toContain("getProfileBrandHubs(");
  });

  it("keeps network structure owner-only and does not invent inherited authority", () => {
    const migration = read(
      "supabase/migrations/20260906101326_add_transactional_business_network_commands_g6.sql",
    );

    expect(migration).toContain("network_structure_requires_profile_owner");
    expect(migration).toContain("p.user_id");
    expect(migration).toContain("private.profile_create_profile_with_extension");
    expect(migration).not.toContain("private.can_manage_profile(");
    expect(migration).not.toContain("private.can_operate_business_profile(");
    expect(migration).toContain("hierarchy never implies inherited Profile management authority");
  });

  it("pins the network broker to JWT verification and service-role governance", () => {
    const config = read("supabase/config.toml");
    const policy = read(
      "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
    );

    expect(config).toContain("[functions.business-network-rpc]");
    expect(
      config.slice(config.indexOf("[functions.business-network-rpc]"))
        .split("\n\n")[0],
    ).toContain("verify_jwt = true");
    expect(policy).toContain('"business-network-rpc"');
    expect(policy).toContain('"authenticated-broker"');
    expect(policy).toContain("requireOperationalAccount");
  });

  it("makes Profile plus Business hierarchy changes in one database transaction", () => {
    const migration = read(
      "supabase/migrations/20260906101326_add_transactional_business_network_commands_g6.sql",
    );

    expect(migration).toContain("business_network_convert_to_network");
    expect(migration).toContain("business_network_create_branch");
    expect(migration).toContain("business_role = 'brand_hub'");
    expect(migration).toContain("business_role = 'branch'");
    expect(migration).toContain("parent_business_id = v_hub.id");
  });
});
