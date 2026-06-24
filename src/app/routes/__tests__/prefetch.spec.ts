import { describe, expect, it } from "vitest";

import { getLaunchWarmupHrefs } from "../prefetch";

describe("route prefetch launch scope", () => {
  it("warms only MVP public routes during idle", () => {
    const hrefs = getLaunchWarmupHrefs();

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/empresas",
        "/gastronomia",
        "/classificados",
        "/servicos",
        "/mapa",
        "/busca",
        "/notifications",
      ]),
    );
    expect(hrefs.some((href) => href.startsWith("/pontos-turisticos"))).toBe(true);
    expect(hrefs.some((href) => href.includes("complexo-do-nordeste-de-amaralina"))).toBe(true);

    expect(hrefs).not.toEqual(
      expect.arrayContaining([
        "/eventos",
        "/vagas",
        "/mobilidade",
        "/ranking",
        "/mensagens",
        "/conta",
      ]),
    );
  });
});
