import { describe, expect, it } from "vitest";

import { buildVagasListPath } from "../publicarVaga.shared";

describe("buildVagasListPath", () => {
  it("returns the canonical city jobs listing", () => {
    expect(buildVagasListPath("/ba/salvador/vagas/publicar")).toBe(
      "/ba/salvador/vagas",
    );
  });

  it("preserves a district or territorial group before the Jobs module", () => {
    expect(
      buildVagasListPath(
        "/ba/salvador/chapada-do-rio-vermelho/vagas/publicar",
      ),
    ).toBe("/ba/salvador/chapada-do-rio-vermelho/vagas");
  });

  it("does not preserve retired Community-embedded routes", () => {
    expect(
      buildVagasListPath("/comunidade/santa-cruz/vagas/publicar"),
    ).toBe("/vagas");
  });

  it("falls back to the global Jobs entry outside a canonical territory", () => {
    expect(buildVagasListPath("/vagas/publicar")).toBe("/vagas");
  });
});
