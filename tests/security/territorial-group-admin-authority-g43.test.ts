import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const config = read("supabase/config.toml");
const broker = read("supabase/functions/territorial-group-admin-rpc/index.ts");
const phaseOne = read(
  "docs/09-reference/migrations-pending/20260910220500_create_territorial_group_admin_commands_g43.sql",
);
const phaseTwo = read(
  "docs/09-reference/migrations-pending/20260910221500_lock_territorial_group_writes_to_broker_g43.sql",
);
const repositoryContract = read(
  "src/core/territorial/repositories/ITerritorialGroupRepository.ts",
);
const repository = read(
  "src/core/territorial/repositories/TerritorialGroupRepositorySupabase.ts",
);
const adminQuery = read(
  "src/core/territorial/services/territorial.admin.queries.ts",
);
const adminHook = read("src/modules/admin/hooks/useTerritorialGroups.ts");
const groupForm = read("src/modules/admin/components/TerritorialGroupForm.tsx");
const districtSelector = read("src/modules/admin/components/DistrictSelector.tsx");

describe("G43 territorial group admin authority", () => {
  it("requires JWT plus canonical admin/MFA authority on the broker", () => {
    expect(config).toMatch(
      /\[functions\.territorial-group-admin-rpc\][\s\S]*?verify_jwt\s*=\s*true/,
    );
    expect(broker).toContain("const auth = await requireAdmin(req);");
    expect(broker).toContain("p_actor_user_id: auth.userId");
    expect(broker).not.toContain("p_actor_user_id: params");
    expect(broker).toContain("territorial_admin_save_group");
    expect(broker).toContain("territorial_admin_set_group_status");
  });

  it("rejects uncorrelated 2xx acknowledgements from both G43 commands", () => {
    expect(broker).toContain("function requireSaveGroupAck(");
    expect(broker).toContain("function requireStatusAck(");
    expect(broker).toContain("group.anchor_city_id !== expected.anchorCityId");
    expect(broker).toContain("value.memberCount !== expected.memberLocationIds.length");
    expect(broker).toContain("!sameMemberSet(value.memberIds, expected.memberLocationIds)");
    expect(broker).toContain("value.created !== expectedCreated");
    expect(broker).toContain("expectedCreated && group.status !== 'inactive'");
    expect(broker).toContain("value.group.id !== groupId || value.group.status !== status");
    expect(broker).toContain("Territorial group save acknowledgement mismatch");
    expect(broker).toContain("Territorial group status acknowledgement mismatch");
  });

  it("keeps group + complete membership replacement inside one SQL transaction", () => {
    expect(phaseOne).toContain(
      "CREATE OR REPLACE FUNCTION public.territorial_admin_save_group(",
    );
    expect(phaseOne).toContain("SECURITY INVOKER");
    expect(phaseOne).toContain("DELETE FROM public.territorial_group_members");
    expect(phaseOne).toContain("INSERT INTO public.territorial_group_members");
    expect(phaseOne).toContain("active_group_requires_member");
    expect(phaseOne).toContain("invalid_group_member_scope");
    expect(phaseOne).toContain("member.parent_id = p_anchor_city_id");
    expect(phaseOne).toContain("member.status::TEXT = 'active'");
    expect(phaseOne).toContain("member.type::TEXT IN ('district', 'neighborhood')");
  });

  it("serializes membership validation and replacement during the compatibility window", () => {
    expect(phaseOne).toContain("FOR UPDATE");
    expect(phaseOne).toContain("ORDER BY member.id");
    expect(phaseOne).toContain("FOR SHARE");
    expect(phaseOne).toContain("GET DIAGNOSTICS v_locked_member_count = ROW_COUNT");
    expect(phaseOne).toContain(
      "LOCK TABLE public.territorial_group_members IN SHARE ROW EXCLUSIVE MODE",
    );
    expect(phaseOne).toContain("postcondition: G43 concurrency locks missing");
  });

  it("uses function ACLs as the SQL execution boundary without deprecated auth.role checks", () => {
    expect(phaseOne).toContain("FROM PUBLIC, anon, authenticated");
    expect(phaseOne).toContain("TO service_role");
    expect(phaseOne).toContain("has_function_privilege(\n    'anon'");
    expect(phaseOne).toContain("has_function_privilege(\n    'authenticated'");
    expect(phaseOne).not.toMatch(/IF\s+(?:\(SELECT\s+)?auth\.role\(\)/);
    expect(phaseOne).toContain("deprecated auth.role boundary reintroduced");
  });

  it("keeps status activation server-owned and rejects active empty groups", () => {
    expect(phaseOne).toContain(
      "CREATE OR REPLACE FUNCTION public.territorial_admin_set_group_status(",
    );
    expect(phaseOne).toContain("p_status = 'active' AND NOT EXISTS");
    expect(phaseOne).toContain("FOR UPDATE");
  });

  it("stages browser DML removal only as a gated phase-two cutover", () => {
    expect(phaseTwo).toContain("DO NOT PROMOTE");
    expect(phaseTwo).toContain("territorial-group-admin-rpc is ACTIVE");
    expect(phaseTwo).toContain("authenticated admin AAL2 smoke");
    expect(phaseTwo).toContain(
      "REVOKE INSERT, UPDATE, DELETE\n  ON TABLE public.territorial_groups",
    );
    expect(phaseTwo).toContain(
      "REVOKE INSERT, UPDATE, DELETE\n  ON TABLE public.territorial_group_members",
    );
    expect(phaseTwo).toContain('CREATE POLICY "Admins view all territorial groups"');
    expect(phaseTwo).toContain(
      'CREATE POLICY "Admins view all territorial group members"',
    );
    expect(phaseTwo).toContain("USING (private.is_admin((SELECT auth.uid())))");
    expect(phaseTwo).toContain("authenticated DML remains");
  });

  it("keeps public/product inventory active-only while admin inventory can include inactive", () => {
    expect(repositoryContract).toContain("listAllForAdmin()");
    expect(repository).toContain("return this.listWithMembers('active')");
    expect(repository).toContain("async listAllForAdmin()");
    expect(repository).toContain("return this.listWithMembers();");
    expect(adminQuery).toContain(".listAllForAdmin()");
    expect(adminHook).toContain("listAdminTerritorialGroups");
    expect(adminHook).not.toContain("service.listAllGroups()");
  });

  it("preserves the real anchor_city_id on edit and keeps anchor mutation locked", () => {
    expect(groupForm).toContain("anchor_city_id?: string | null");
    expect(groupForm).toContain("setAnchorCityId(group.anchor_city_id ?? '')");
    expect(groupForm).not.toContain("setAnchorCityId(group.parent_id");
    expect(groupForm).toContain("anchorCityLocked={Boolean(group)}");
    expect(districtSelector).toContain("anchorCityLocked?: boolean");
    expect(districtSelector).toContain("disabled={disabled || anchorCityLocked}");
  });
});
