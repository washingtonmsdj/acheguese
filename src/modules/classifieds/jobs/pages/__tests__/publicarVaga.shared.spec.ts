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

  it("preserva a URL curta da comunidade ao voltar da publicacao", () => {
    expect(buildVagasListPath("/santa-cruz/vagas/publicar")).toBe(
      "/santa-cruz/vagas",
    );
  });

  it("volta para a rota publica de vagas fora da comunidade", () => {
    expect(buildVagasListPath("/vagas/publicar")).toBe("/vagas");
  });
});
