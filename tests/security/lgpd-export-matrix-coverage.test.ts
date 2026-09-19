import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = readFileSync(
  resolve(root, "supabase/functions/user-export-data/index.ts"),
  "utf8",
);
const matrix = JSON.parse(
  readFileSync(
    resolve(
      root,
      "docs/09-reference/governance/privacy/LGPD_EXPORT_MATRIX.json",
    ),
    "utf8",
  ),
) as {
  sections: Array<{
    section: string;
    scope: string;
    sources?: string[];
  }>;
};

function topLevelExportSections(): string[] {
  const start = source.indexOf("  const sections: JsonRecord = {");
  const end = source.indexOf("\n  const redactions =", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return [
    ...source
      .slice(start, end)
      .matchAll(/^    ([a-z_]+)(?::|,)/gm),
  ].map((match) => match[1]);
}

describe("LGPD export matrix coverage", () => {
  it("covers every active matrix section and public source explicitly", () => {
    const sections = new Set(topLevelExportSections());

    for (const entry of matrix.sections) {
      if (entry.scope === "excluded") continue;

      expect(sections.has(entry.section), entry.section).toBe(true);

      for (const sourceRef of entry.sources ?? []) {
        if (!sourceRef.startsWith("public.") || sourceRef.includes("*")) continue;
        const table = sourceRef.slice("public.".length);
        expect(
          source.includes(`"${table}"`) || source.includes(`'${table}'`),
          `${entry.section} -> ${table}`,
        ).toBe(true);
      }
    }
  });

  it("keeps every ExportTable entry wired into the table dispatcher", () => {
    const unionStart = source.indexOf("type ExportTable =");
    const unionEnd = source.indexOf(";\n\nfunction responseHeaders", unionStart);
    const union = source.slice(unionStart, unionEnd);
    const tables = [...union.matchAll(/\| "([^"]+)"/g)].map((match) => match[1]);
    const cases = new Set(
      [...source.matchAll(/case "([^"]+)": return supabaseAdmin\.from/g)].map(
        (match) => match[1],
      ),
    );

    expect(tables.length).toBeGreaterThan(0);
    expect(new Set(tables).size).toBe(tables.length);
    for (const table of tables) {
      expect(cases.has(table), table).toBe(true);
    }
  });

  it("keeps broad/stale export paths forbidden", () => {
    for (const forbidden of [
      ".eq('owner_id', userId)",
      ".eq('passenger_id', userId)",
      ".from('user_sessions')",
      ".eq('organizer_id', userId)",
      ".from('application_logs')",
      "app_metadata:",
      "identity_data:",
      ".select('*')",
      '.select("*")',
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("keeps sensitive fields redacted in the newly covered sections", () => {
    expect(source).toContain(
      '"old_username,new_username,changed_at"',
    );
    expect(source).toContain('"old_slug,new_slug,changed_at"');
    expect(source).toContain('"role,action,performed_at"');
    expect(source).toContain(
      '"business_id,status,notes,created_at,updated_at,reviewed_at"',
    );
    expect(source).toContain('"event_id,joined_at,checked_in_at"');
    expect(source).toContain('"review_id,created_at"');
    expect(source).toContain(
      '"business_id,source_module,created_at,updated_at"',
    );

    expect(source).not.toContain(
      '"old_slug,new_slug,changed_at,changed_by,reason"',
    );
    expect(source).not.toContain(
      '"business_id,status,notes,documents,reviewed_by,review_notes"',
    );
    expect(source).not.toContain(
      '"event_id,joined_at,checked_in_at,checkin_code"',
    );
    expect(source).not.toContain(
      '"business_id,source_module,metadata,created_at,updated_at"',
    );
  });

  it("does not self-certify rollout before exact-SHA gates", () => {
    expect(source).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
  });
});
