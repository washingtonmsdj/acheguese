import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE_PATH = "src/app/pages/NotFound.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("NotFound public shell", () => {
  it("keeps user-facing fallback copy in PT-BR", () => {
    const page = read(PAGE_PATH);

    expect(page).toContain("Página não encontrada");
    expect(page).toContain("O endereço que você tentou abrir não existe ou foi movido.");
    expect(page).toContain("Voltar para o início");
    expect(page).not.toContain("Oops! Page not found");
    expect(page).not.toContain("Return to Home");
  });

  it("uses SPA navigation while preserving error tracking", () => {
    const page = read(PAGE_PATH);

    expect(page).toContain('import { Link, useLocation } from "react-router-dom";');
    expect(page).toContain('<Link\n          to="/"');
    expect(page).not.toContain('<a href="/"');
    expect(page).toContain("trackError(");
    expect(page).toContain("metadata: { pathname: location.pathname }");
  });

  it("projects the public fallback from canonical territory tokens", () => {
    const page = read(PAGE_PATH);

    for (const token of [
      "bg-territory-canvas",
      "bg-territory-surface",
      "border-territory-border",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "bg-territory-sun",
      "ring-territory-brand",
    ]) {
      expect(page).toContain(token);
    }

    for (const legacyUtility of [
      "bg-muted",
      "bg-background",
      "border-border",
      "text-muted-foreground",
      "text-foreground",
      "text-primary",
    ]) {
      expect(page).not.toContain(legacyUtility);
    }
  });
});
