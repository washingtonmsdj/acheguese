import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community recommendations page ownership", () => {
  const pages = [
    "RecomendacoesPage",
    "NovaRecomendacaoPage",
    "RecomendacaoDetailPage",
  ] as const;

  it("owns recommendation pages in the explicit bounded context", () => {
    for (const page of pages) {
      const canonical = read(
        `src/core/community-recommendations/pages/${page}.tsx`,
      );
      const legacy = read(`src/core/community/pages/${page}.tsx`);

      expect(canonical.length).toBeGreaterThan(500);
      expect(legacy.trim()).toBe(
        `export { default } from "@/core/community-recommendations/pages/${page}";`,
      );
    }
  });

  it("uses explicit community-experience facades from recommendation list/create", () => {
    const list = read(
      "src/core/community-recommendations/pages/RecomendacoesPage.tsx",
    );
    const create = read(
      "src/core/community-recommendations/pages/NovaRecomendacaoPage.tsx",
    );

    for (const source of [list, create]) {
      expect(source).toContain("@/core/community-experience/access");
      expect(source).not.toContain('from "@/core/community/access"');
      expect(source).not.toContain(
        "@/core/community/utils/communityRouteTerritory",
      );
    }

    expect(list).toContain(
      "@/core/community-experience/utils/communityRouteTerritory",
    );
    expect(create).toContain(
      "@/core/community-experience/utils/communityRouteTerritory",
    );
  });
});
