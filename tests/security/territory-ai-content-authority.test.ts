import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const service = read(
  "src/core/territorial/services/TerritorialAIService.ts",
);
const publicHook = read(
  "src/core/territorial/hooks/useTerritoryAIContent.ts",
);
const adminHook = read(
  "src/core/territorial/hooks/useTerritoryAIContentAdmin.ts",
);
const broker = read("supabase/functions/territory-ai-content/index.ts");

const HARDENING =
  "20260918135208_harden_territory_ai_content_browser_authority.sql";
const LEGACY_UPDATE_BRIDGE =
  "20260918135505_preserve_territory_ai_legacy_admin_update.sql";
const RETIRE_DIRECT_UPDATE =
  "20260918135700_retire_territory_ai_legacy_admin_update.sql";
const REMOVE_TRIGGER =
  "20260918135813_remove_obsolete_territory_ai_manual_edit_trigger.sql";
const LEGACY_READ_BRIDGE =
  "20260918135814_preserve_territory_ai_legacy_browser_read.sql";

describe("territory AI content authority", () => {
  it("keeps public runtime read-only on an explicit projection", () => {
    expect(service).toContain("const PUBLIC_COLUMNS = [");
    expect(service).toContain('.from("territory_ai_content")');
    expect(service).toContain(".select(PUBLIC_COLUMNS)");
    expect(service).not.toContain('.select("*")');

    expect(publicHook).toContain("TerritorialAIService.getAIContent");
    expect(publicHook).not.toContain("generateWithAI");
    expect(publicHook).not.toContain("updateContent");
  });

  it("routes every admin read/write through the authenticated broker", () => {
    expect(service).toContain('const TERRITORY_AI_FUNCTION = "territory-ai-content"');
    expect(service).toContain('action: "get"');
    expect(service).toContain('action: "generate"');
    expect(service).toContain('action: "update"');
    expect(service).not.toMatch(
      /\.from\(["']territory_ai_content["']\)[\s\S]{0,220}\.(?:insert|update|upsert|delete)\s*\(/m,
    );

    expect(adminHook).toContain("TerritorialAIService.getAdminContent");
    expect(adminHook).toContain("TerritorialAIService.generateAIContent");
    expect(adminHook).toContain("TerritorialAIService.updateAIContent");
  });

  it("keeps the Edge broker admin/MFA authorized and canonicalizes territory identity server-side", () => {
    expect(broker).toContain("requireAdmin(req, ALLOWED_METHODS)");
    expect(broker).toContain("getRequiredEnv");
    expect(broker).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(broker).toContain("resolveTerritoryContext");
    expect(broker).toContain('.from("territorial_groups")');
    expect(broker).toContain('.from("territorial_group_members")');
    expect(broker).toContain('.from("locations")');
    expect(broker).toContain('group.status !== "active"');
    expect(broker).toContain('city.status !== "active"');

    expect(broker).toContain("get: true");
    expect(broker).toContain("generate: true");
    expect(broker).toContain("update: true");
    expect(broker).toContain("action === \"generate\" ? 10 : 120");
    expect(broker).toContain("MAX_BODY_BYTES = 32_768");
  });

  it("preserves the deployed legacy generate payload without trusting its name/member claims", () => {
    expect(broker).toContain("Backward compatibility with the currently deployed admin client");
    expect(broker).toContain('action: "generate"');
    expect(broker).toContain(
      "params: { territory_slug: body.territory_slug }",
    );
    expect(broker).not.toContain(
      "params: { territory_slug: body.territory_slug, territory_name:",
    );
    expect(broker).not.toContain(
      "params: { territory_slug: body.territory_slug, members:",
    );
  });

  it("versions the exact remote authority transition and retires browser mutations", () => {
    for (const name of [
      HARDENING,
      LEGACY_UPDATE_BRIDGE,
      RETIRE_DIRECT_UPDATE,
      REMOVE_TRIGGER,
      LEGACY_READ_BRIDGE,
    ]) {
      expect(read(`supabase/migrations/${name}`)).toBeTruthy();
    }

    const retirement = read(
      `supabase/migrations/${RETIRE_DIRECT_UPDATE}`,
    );
    expect(retirement).toContain(
      'DROP POLICY IF EXISTS "Admins update territory content"',
    );
    expect(retirement).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.territory_ai_content",
    );
    expect(retirement).toContain(
      "browser mutation authority remains on territory_ai_content",
    );

    const cleanup = read(`supabase/migrations/${REMOVE_TRIGGER}`);
    expect(cleanup).toContain(
      "DROP FUNCTION IF EXISTS private.stamp_territory_ai_manual_edit()",
    );
  });

  it("keeps the temporary legacy read bridge read-only", () => {
    const bridge = read(`supabase/migrations/${LEGACY_READ_BRIDGE}`);
    expect(bridge).toContain(
      "GRANT SELECT ON TABLE public.territory_ai_content",
    );
    expect(bridge).toContain("TO anon, authenticated");
    expect(bridge).not.toMatch(
      /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL(?:\s+PRIVILEGES)?)\s+ON\s+(?:TABLE\s+)?public\.territory_ai_content\s+TO\s+[^;]*(?:anon|authenticated)/i,
    );
    expect(bridge).toContain(
      "territory AI table-wide browser write authority returned",
    );
  });

  it("does not let later migrations reintroduce browser writes", () => {
    const migrationsDir = resolve(root, "supabase/migrations");
    const later = readdirSync(migrationsDir)
      .filter(
        (name) =>
          name.endsWith(".sql") && name > LEGACY_READ_BRIDGE,
      )
      .sort();

    const regressions: string[] = [];
    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");
      if (
        /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|INSERT|UPDATE|DELETE)\s+ON\s+(?:TABLE\s+)?public\.territory_ai_content\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        regressions.push(name);
      }
    }

    expect(regressions).toEqual([]);
  });
});
