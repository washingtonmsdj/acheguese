import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community public post detail territory boundary", () => {
  it("filters public detail in core/posts before returning the row", () => {
    const queries = read("src/core/posts/services/posts.queries.ts");

    expect(queries).toContain("export async function getPublicPostById");
    expect(queries).toContain('.eq("is_published", true)');
    expect(queries).toContain('.eq("is_hidden", false)');
    expect(queries).toContain('.eq("is_removed", false)');
    expect(queries).toContain("applyTerritoryFilter(");
    expect(queries).toContain("territoryFilter.scope === \"none\"");
  });

  it("requires the route territory in the Community detail adapter", () => {
    const detail = read("src/core/community-feed/hooks/usePostById.ts");
    const communityHook = read(
      "src/core/community-feed/hooks/useComunidadePage.ts",
    );
    const page = read("src/core/community-feed/pages/ComunidadePage.tsx");

    expect(detail).toContain("postService.getPublicPostById(");
    expect(detail).not.toContain("postService.getPostById(");
    expect(detail).toContain("territoryFilterKey(territoryFilter)");
    expect(detail).toContain("isTerritoryFilterReady(territoryFilter)");
    expect(communityHook).toContain("usePostById(\n    postId,\n    territoryFilter,");
    expect(page).toContain("useComunidadePage(territoryFilter)");
  });
});
