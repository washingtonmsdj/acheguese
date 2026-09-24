import { describe, expect, it } from "vitest";

import { getActiveWarmupHrefs } from "../prefetch";

describe("route prefetch canonical lifecycle", () => {
  it("warms only the active MVP domain and horizontal capabilities", () => {
    expect(getActiveWarmupHrefs()).toEqual([
      "/empresas",
      "/mapa",
      "/perto-de-mim",
      "/busca",
      "/notificacoes",
    ]);
  });
});
