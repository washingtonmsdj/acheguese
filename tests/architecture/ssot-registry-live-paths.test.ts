import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REGISTRY_PATH = "docs/architecture/SSOT_REGISTRY.md";
const REPO_PATH = /^(?:src|docs|tools|supabase)\/[a-zA-Z0-9_.\/-]+$/;

/**
 * Verifica referências de arquivos e diretórios explícitos do registry.
 * Outros spans (ex.: nomes de símbolos, exemplos e padrões com "*")
 * não são declarações de caminhos resolvíveis.
 */
function documentedRepositoryPaths(document: string): string[] {
  const paths = [...document.matchAll(
    /`((?:src|docs|tools|supabase)\/[^\r\n`]+)`/g,
  )]
    .map((match) => match[1])
    .filter((candidate) => REPO_PATH.test(candidate));

  return [...new Set(paths)];
}

describe("SSOT registry: referências executáveis", () => {
  it("não aponta para owners nem migrations que deixaram de existir", () => {
    const registry = readFileSync(resolve(ROOT, REGISTRY_PATH), "utf8");
    const references = documentedRepositoryPaths(registry);
    const missing = references.filter(
      (repoPath) => !existsSync(resolve(ROOT, repoPath)),
    );

    expect(references.length).toBeGreaterThan(50);
    expect(missing).toEqual([]);
  });

  it("mantém a separação entre contrato de domínio e apresentação", () => {
    const registry = readFileSync(resolve(ROOT, REGISTRY_PATH), "utf8");

    expect(registry).toContain(
      "`src/core/classifieds/services/types.ts`",
    );
    expect(registry).toContain(
      "`src/modules/classifieds/sections/types.ts`",
    );
    expect(registry).toContain(
      "`src/core/admin/identity/sections/types.ts`",
    );
    expect(registry).toContain(
      "`src/core/favorites/services/BusinessFavoriteStore.ts`",
    );
    expect(registry).not.toContain(
      "`src/core/favorites/services/FavoritesService.ts`",
    );
  });
});
