import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Community recommendations ownership", () => {
  it("keeps Q&A service and hooks on the explicit recommendations owner", () => {
    for (const relativePath of [
      "src/core/community-recommendations/services/CommunityQAService.ts",
      "src/core/community-recommendations/hooks/useRecomendacoes.ts",
      "src/core/community-recommendations/hooks/useNovaRecomendacao.ts",
      "src/core/community-recommendations/hooks/useRecomendacaoDetail.ts",
    ]) {
      expect(existsSync(join(ROOT, relativePath))).toBe(true);
    }

    for (const relativePath of [
      "src/core/community/services/CommunityQAService.ts",
      "src/core/community/hooks/useRecomendacoes.ts",
      "src/core/community/hooks/useNovaRecomendacao.ts",
      "src/core/community/hooks/useRecomendacaoDetail.ts",
    ]) {
      expect(existsSync(join(ROOT, relativePath))).toBe(false);
    }
  });

  it("keeps recommendation pages wired to the explicit owner", () => {
    const listPage = readFileSync(
      join(ROOT, "src/core/community-recommendations/pages/RecomendacoesPage.tsx"),
      "utf8",
    );
    const createPage = readFileSync(
      join(ROOT, "src/core/community-recommendations/pages/NovaRecomendacaoPage.tsx"),
      "utf8",
    );
    const detailPage = readFileSync(
      join(ROOT, "src/core/community-recommendations/pages/RecomendacaoDetailPage.tsx"),
      "utf8",
    );

    expect(listPage).toContain(
      "@/core/community-recommendations/hooks/useRecomendacoes",
    );
    expect(createPage).toContain(
      "@/core/community-recommendations/hooks/useNovaRecomendacao",
    );
    expect(detailPage).toContain(
      "@/core/community-recommendations/hooks/useRecomendacaoDetail",
    );
  });
});
