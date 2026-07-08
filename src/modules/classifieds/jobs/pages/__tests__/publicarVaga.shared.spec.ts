import { describe, expect, it } from "vitest";

import { buildVagasListPath } from "../publicarVaga.shared";

describe("buildVagasListPath", () => {
  it("retorna listagem de vagas embutida na comunidade municipal", () => {
    expect(buildVagasListPath("/comunidade/ba/salvador/vagas/publicar")).toBe(
      "/comunidade/ba/salvador/vagas",
    );
  });

  it("preserva bairro ou grupo em vagas embutidas na comunidade", () => {
    expect(
      buildVagasListPath(
        "/comunidade/ba/salvador/chapada-do-rio-vermelho/vagas/publicar",
      ),
    ).toBe("/comunidade/ba/salvador/chapada-do-rio-vermelho/vagas");
  });

  it("preserva o alias explicito da comunidade ao voltar da publicacao", () => {
    expect(buildVagasListPath("/comunidade/santa-cruz/vagas/publicar")).toBe(
      "/comunidade/santa-cruz/vagas",
    );
  });

  it("volta para a rota publica de vagas fora da comunidade", () => {
    expect(buildVagasListPath("/vagas/publicar")).toBe("/vagas");
  });
});
