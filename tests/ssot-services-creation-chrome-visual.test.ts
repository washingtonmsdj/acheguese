import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SERVICES_CREATION_SURFACES = [
  "src/modules/professionals/services/pages/CadastrarServicoPage.tsx",
  "src/modules/professionals/services/pages/CadastrarServicoChrome.tsx",
  "src/modules/professionals/services/pages/CadastrarServicoReview.tsx",
] as const;

const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("Services creation visual SSOT", () => {
  it("uses territorial tokens for shell, chrome, review and navigation", () => {
    const source = SERVICES_CREATION_SURFACES.map(read).join("\n");

    for (const token of [
      "territory-canvas",
      "territory-brand",
      "territory-border",
      "territory-surface",
      "territory-raised",
      "territory-ink",
      "territory-muted",
      "territory-on-image",
    ]) {
      expect(source, `missing ${token}`).toContain(token);
    }
  });

  it("does not regress to generic theme tokens or hardcoded shadows", () => {
    for (const relativePath of SERVICES_CREATION_SURFACES) {
      const source = read(relativePath);

      for (const legacyToken of [
        "border-border",
        "bg-background",
        "bg-card",
        "text-foreground",
        "text-muted-foreground",
        "border-primary",
        "bg-primary",
        "text-primary",
        "bg-secondary",
        "rgba(0,214,201",
        "rgba(0,0,0",
      ]) {
        expect(source, `${relativePath}: ${legacyToken}`).not.toContain(legacyToken);
      }
    }
  });

  it("keeps user-facing Portuguese copy accented", () => {
    const source = SERVICES_CREATION_SURFACES.map(read).join("\n");

    for (const copy of [
      "Cadastrar serviço",
      "cadastrando serviço como",
      "Próximo",
      "Publicar serviço",
      "Título do serviço",
      "Descrição",
      "Experiência",
      "Preço",
      "Horário",
      "Formação",
      "ficará disponível",
    ]) {
      expect(source, `missing accented copy: ${copy}`).toContain(copy);
    }
  });
});
