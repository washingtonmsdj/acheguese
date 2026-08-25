import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community alert runtime contract", () => {
  it("keeps the database vocabulary aligned with the current alert domain", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260825261000_repair_community_alert_runtime_contract.sql",
    );
    const service = readProjectFile(
      "src/core/community/alerts/services/CommunityAlertService.ts",
    );

    for (const status of ["ativo", "encerrado", "expirado", "removido"]) {
      expect(migration).toContain(`'${status}'`);
    }

    for (const category of [
      "tiroteio_disparos",
      "assalto_em_andamento",
      "tentativa_de_invasao",
      "incendio_explosao",
      "acidente_grave",
      "alagamento_deslizamento",
      "risco_na_via",
      "pessoa_vulneravel_em_risco",
    ]) {
      expect(migration).toContain(`'${category}'`);
      expect(service).toContain(`"${category}"`);
    }

    expect(migration).toContain("'territory_centroid'");
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Alerts viewable" ON public.community_alerts',
    );
    expect(migration).toContain('CREATE POLICY "community_alerts_public_active_read"');
    expect(migration).toContain("USING (status = 'ativo' AND removed_at IS NULL)");
    expect(migration).toContain('CREATE POLICY "community_alerts_platform_admin_read"');
  });

  it("publishes through the canonical active-profile resolver", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260825262000_use_active_profile_for_community_alerts.sql",
    );
    const broker = readProjectFile(
      "src/core/community/services/CommunityRpcService.ts",
    );

    expect(migration).toContain("FROM public.get_active_profile(v_user_id) profile");
    expect(migration).toContain("legacy oldest-profile resolver remains");
    expect(broker).toContain('functionName: FUNCTION_NAME');
    expect(broker).toContain('const FUNCTION_NAME = "community-rpc"');
    expect(broker).toContain('type CommunityRpcAction = "createAlert"');
  });
});
