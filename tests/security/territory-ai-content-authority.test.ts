import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = resolve(root, "supabase/migrations");
const FINAL_BOUNDARY =
  "20260918140847_enforce_territory_ai_broker_only_authority.sql";
const TRIGGER_REMOVAL =
  "20260918135813_remove_obsolete_territory_ai_manual_edit_trigger.sql";

const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("territory AI content authority", () => {
  const finalBoundary = read(`supabase/migrations/${FINAL_BOUNDARY}`);
  const triggerRemoval = read(`supabase/migrations/${TRIGGER_REMOVAL}`);
  const service = read(
    "src/core/territorial/services/TerritorialAIService.ts",
  );
  const publicHook = read(
    "src/core/territorial/hooks/useTerritoryAIContent.ts",
  );
  const adminHook = read(
    "src/core/territorial/hooks/useTerritoryAIContentAdmin.ts",
  );
  const edge = read("supabase/functions/territory-ai-content/index.ts");
  const adminPage = read("src/modules/admin/pages/AdminTerritoryContent.tsx");

  it("keeps the browser boundary read-only and column-bounded", () => {
    expect(finalBoundary).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.territory_ai_content",
    );
    expect(finalBoundary).toContain("GRANT SELECT (");
    expect(finalBoundary).toContain("territory_slug");
    expect(finalBoundary).toContain("ai_generated_at");
    expect(finalBoundary).toContain("TO anon, authenticated");
    expect(finalBoundary).toContain(
      "GRANT ALL PRIVILEGES ON TABLE public.territory_ai_content",
    );
    expect(finalBoundary).toContain("TO service_role");

    expect(finalBoundary).toContain(
      "table-wide territory AI SELECT remains",
    );
    expect(finalBoundary).toContain(
      "browser territory AI mutation authority remains",
    );
    expect(finalBoundary).toContain(
      "administrative territory AI fields remain browser-readable",
    );
  });

  it("keeps public reads explicit and all admin operations brokered", () => {
    expect(service).toContain("PUBLIC_COLUMNS");
    expect(service).toContain(".select(PUBLIC_COLUMNS)");
    expect(service).not.toContain('.select("*")');
    expect(service).not.toContain(".select('*')");
    expect(service).not.toContain(".update(");
    expect(service).not.toContain(".insert(");
    expect(service).not.toContain(".upsert(");

    expect(service).toContain('action: "get"');
    expect(service).toContain('action: "generate"');
    expect(service).toContain('action: "update"');

    expect(publicHook).not.toContain("useMutation");
    expect(publicHook).not.toContain("generateWithAI");
    expect(publicHook).not.toContain("updateContent");

    expect(adminHook).toContain("useMutation");
    expect(adminHook).toContain("generateAIContent");
    expect(adminHook).toContain("updateAIContent");
  });

  it("keeps territory identity server-owned in the admin flow", () => {
    expect(adminPage).not.toContain("setName(");
    expect(adminPage).not.toContain("territory_name:");
    expect(adminPage).not.toContain("members:");

    expect(service).not.toContain("territory_name:");
    expect(service).not.toContain("members:");

    expect(edge).toContain("resolveTerritoryContext(");
    expect(edge).toContain('.from("territorial_groups")');
    expect(edge).toContain('.from("territorial_group_members")');
    expect(edge).toContain('.from("locations")');
    expect(edge).toContain("territory_name: context.territoryName");
  });

  it("uses the canonical admin client with no compatibility fallback", () => {
    expect(edge).toContain("getSupabaseAdminClient");
    expect(edge).toContain("requireAdmin(req, ALLOWED_METHODS)");
    expect(edge).toContain("rateLimitMiddleware(");
    expect(edge).toContain("checkRateLimit(");
    expect(edge).not.toContain("createClient");
    expect(edge).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edge).not.toContain("Backward compatibility");
    expect(edge).not.toMatch(/\blegacy\b/i);
    expect(edge).not.toContain("body.territory_slug");
    expect(edge).not.toContain("body.territory_name");
    expect(edge).not.toContain("body.members");
  });

  it("removes the obsolete browser-edit trigger and helper", () => {
    expect(triggerRemoval).toContain(
      "DROP TRIGGER IF EXISTS stamp_territory_ai_manual_edit",
    );
    expect(triggerRemoval).toContain(
      "DROP FUNCTION IF EXISTS private.stamp_territory_ai_manual_edit()",
    );
    expect(triggerRemoval).toContain(
      "obsolete territory AI manual-edit trigger still exists",
    );
    expect(triggerRemoval).toContain(
      "obsolete territory AI manual-edit function still exists",
    );
  });

  it("prevents future migrations from reopening legacy browser authority", () => {
    const offenders: string[] = [];
    const later = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name > FINAL_BOUNDARY)
      .sort();

    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");

      if (
        /GRANT\s+SELECT\s+ON\s+(?:TABLE\s+)?public\.territory_ai_content\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: table-wide SELECT`);
      }

      if (
        /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL(?:\s+PRIVILEGES)?)\s+(?:\([^;]*\)\s*)?ON\s+(?:TABLE\s+)?public\.territory_ai_content\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: browser DML`);
      }

      if (
        /GRANT\s+SELECT\s*\([^;]*\b(?:id|is_manual_override|manually_edited_at|created_at|updated_at)\b[^;]*\)\s*ON\s+(?:TABLE\s+)?public\.territory_ai_content\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: administrative SELECT columns`);
      }

      if (
        /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+private\.stamp_territory_ai_(?:legacy_)?manual_edit/i.test(
          sql,
        ) ||
        /CREATE\s+TRIGGER\s+stamp_territory_ai_(?:legacy_)?manual_edit/i.test(sql)
      ) {
        offenders.push(`${name}: obsolete manual-edit trigger authority`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
