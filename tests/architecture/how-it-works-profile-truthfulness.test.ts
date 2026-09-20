import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public how-it-works profile examples", () => {
  const source = readFileSync("src/app/pages/ComoFuncionaPage.tsx", "utf8");

  it("explains profile types without presenting fictional identities as real users", () => {
    expect(source).toContain('"Perfil pessoal"');
    expect(source).toContain('"Perfil de negócio"');
    expect(source).toContain('"Perfil profissional"');

    expect(source).not.toContain("Ana Oliveira");
    expect(source).not.toContain("Sabores da Ana");
    expect(source).not.toContain("Ana Serviços");
    expect(source).not.toContain("persona-morador.jpg");
    expect(source).not.toContain("persona-comerciante.jpg");
    expect(source).not.toContain("persona-prestador.jpg");
  });
});
