import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Professional admin authority G38", () => {
  it("moves availability mutation behind the admin broker", () => {
    const mutation = read("src/core/professional/services/professional.mutations.ts");
    const edge = read("supabase/functions/admin-professional-rpc/index.ts");

    expect(mutation).toContain('supabase.functions.invoke("admin-professional-rpc"');
    expect(mutation).not.toContain('.from<Professional>("professional_data")');
    expect(mutation).not.toContain('professional_data")\n      .update');

    expect(edge).toContain('const ACTIONS = { setAvailability: true } as const;');
    expect(edge).toContain("requireAdmin(req)");
    expect(edge).toContain("getSupabaseAdminClient()");
    expect(edge).toContain('.from("professional_data")');
    expect(edge).toContain("is_accepting_clients: isAcceptingClients");
    expect(edge).not.toContain("professionalPatch");
  });

  it("requires the Edge acknowledgement to match both target and requested availability", () => {
    const mutation = read("src/core/professional/services/professional.mutations.ts");

    expect(mutation).toContain("resolveSupabaseFunctionErrorMessage");
    expect(mutation).toContain("updated.id !== id");
    expect(mutation).toContain(
      "updated.is_accepting_clients !== isAcceptingClients",
    );
    expect(mutation).toContain(
      "Resposta invalida ao atualizar disponibilidade do profissional",
    );
  });

  it("uses the canonical active/inactive status vocabulary in Admin Services", () => {
    const page = read("src/modules/admin/pages/AdminServicos.tsx");

    expect(page).toContain('type AvailabilityFilter = "all" | "active" | "inactive";');
    expect(page).toContain('updateAvailability(professional.id, "active")');
    expect(page).toContain('updateAvailability(professional.id, "inactive")');
    expect(page).not.toContain('"aprovado"');
    expect(page).not.toContain('"rejeitado"');
    expect(page).not.toContain('"pendente"');
  });

  it("registers the broker in Supabase and security governance", () => {
    const config = read("supabase/config.toml");
    const policy = read(
      "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
    );

    expect(config).toContain("[functions.admin-professional-rpc]");
    expect(config).toMatch(/\[functions\.admin-professional-rpc\]\s+verify_jwt = true/);
    expect(policy).toContain('"admin-professional-rpc"');
    expect(policy).toContain('"label": "admin Professional availability broker"');
  });
});
