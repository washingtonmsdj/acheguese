import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community lost-found page ownership", () => {
  const pages = [
    "AchadosPerdidosPage",
    "AchadoPerdidoDetailPage",
    "NovoAchadoPerdidoPage",
  ] as const;

  it("owns lost-found pages in the explicit bounded context", () => {
    const barrel = read("src/core/community-lost-found/index.ts");

    for (const page of pages) {
      const canonical = read(`src/core/community-lost-found/pages/${page}.tsx`);
      const legacy = read(`src/core/community/pages/${page}.tsx`);

      expect(canonical.length).toBeGreaterThan(500);
      expect(legacy.trim()).toBe(
        `export { default } from "@/core/community-lost-found/pages/${page}";`,
      );
      expect(barrel).toContain(`"./pages/${page}"`);
    }
  });

  it("uses explicit community-experience facades from lost-found UI", () => {
    const list = read(
      "src/core/community-lost-found/pages/AchadosPerdidosPage.tsx",
    );
    const create = read(
      "src/core/community-lost-found/pages/NovoAchadoPerdidoPage.tsx",
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
