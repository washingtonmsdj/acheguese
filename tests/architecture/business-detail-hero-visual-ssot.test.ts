import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hero = readFileSync(
  "src/modules/business/company/sections/EmpresaHeroSection.tsx",
  "utf8",
);

const directPalette =
  /\b(?:text|bg|border|ring|ring-offset|fill|from|to)-(?:teal|cyan|emerald|slate|white|black|amber|orange|rose|sky|gray)(?:[-/\[]|\b)/;

describe("Business detail hero visual SSOT", () => {
  it("uses semantic territorial colors and canonical PT-BR copy", () => {
    for (const token of [
      "territory-action-on-image",
      "territory-image-overlay",
      "territory-on-image",
      "territory-brand-strong",
      "territory-success",
      "territory-error",
      "territory-sun",
      "territory-warm",
    ]) {
      expect(hero).toContain(token);
    }

    for (const copy of [
      "Horário não informado",
      "Cartão",
      "avaliação",
      "avaliações",
      "Esta é a sua empresa?",
      "Reivindique, atualize informações e veja estatísticas.",
    ]) {
      expect(hero).toContain(copy);
    }

    expect(hero).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(hero).not.toMatch(/\brgba?\s*\(/);
    expect(hero).not.toMatch(directPalette);
    expect(hero).not.toContain("Horario nao informado");
    expect(hero).not.toContain("Cartao");
    expect(hero).not.toContain("avaliacao");
    expect(hero).not.toContain("avaliacoes");
    expect(hero).not.toContain("Esta e a sua empresa?");
    expect(hero).not.toContain("atualize informacoes");
  });
});
