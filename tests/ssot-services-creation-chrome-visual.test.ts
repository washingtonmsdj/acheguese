import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHROME_PATH =
  "src/modules/professionals/services/pages/CadastrarServicoChrome.tsx";

const read = () => fs.readFileSync(path.join(ROOT, CHROME_PATH), "utf8");

describe("Services creation chrome visual SSOT", () => {
  it("uses territorial tokens for header, steps and navigation", () => {
    const source = read();

    for (const token of [
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

  it("does not regress to generic theme tokens or hardcoded brand shadows", () => {
    const source = read();

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
    ]) {
      expect(source, legacyToken).not.toContain(legacyToken);
    }
  });

  it("keeps user-facing Portuguese copy accented", () => {
    const source = read();

    expect(source).toContain("Cadastrar serviço");
    expect(source).toContain("cadastrando serviço como");
    expect(source).toContain("Próximo");
    expect(source).toContain("Publicar serviço");
  });
});
