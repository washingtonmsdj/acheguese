import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const retired = [
  "src/core/community/pages/EventosPage.tsx",
  "src/core/community/pages/EventoDetailPage.tsx",
  "src/core/community/hooks/useEventos.ts",
];

describe("G6 Community events ownership", () => {
  it("keeps retired generic Community event owners absent", () => {
    for (const relativePath of retired) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("keeps territorial event routing on the explicit community-events owner", () => {
    const territorial = readFileSync(
      join(ROOT, "src/app/routes/territorial/TerritorialModulePages.tsx"),
      "utf8",
    );
    const listPage = readFileSync(
      join(ROOT, "src/modules/community-events/pages/EventsListPage.tsx"),
      "utf8",
    );
    const territoryHook = readFileSync(
      join(
        ROOT,
        "src/modules/community-events/hooks/useEventTerritoryFilter.ts",
      ),
      "utf8",
    );

    expect(territorial).toContain(
      'import("@/modules/community-events/pages/EventsListPage")',
    );
    expect(listPage).toContain(
      "useEventTerritoryFilter(resolved, activeMemberIds)",
    );
    expect(territoryHook).toContain("useModuleTerritoryFilter({");
    expect(territoryHook).toContain("includeDescendants: false");
    expect(territoryHook).not.toContain("useTerritoryFilter(");
  });
});
