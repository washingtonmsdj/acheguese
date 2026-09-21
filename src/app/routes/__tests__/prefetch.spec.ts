import { describe, expect, it } from "vitest";

import { getLaunchWarmupHrefs } from "../prefetch";

describe("route prefetch launch scope", () => {
  it("warms only the active MVP product modules plus infrastructure", () => {
    expect(getLaunchWarmupHrefs()).toEqual([
      "/empresas",
      "/mapa",
      "/perto-de-mim",
      "/notifications",
    ]);
  });
});
