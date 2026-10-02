import { describe, expect, it } from "vitest";
import { APP_GLOBAL_PATHS } from "@/core/routing/config/global";

describe("active global route SSOT", () => {
  it("owns the active global aliases used outside territorial routing", () => {
    expect(APP_GLOBAL_PATHS).toMatchObject({
      notifications: "/notificacoes",
      businessRegistration: "/empresas/cadastrar",
      map: "/mapa",
      nearby: "/perto-de-mim",
      search: "/busca",
      aiSearch: "/buscar",
      about: "/sobre",
      howItWorks: "/como-funciona",
    });
  });
});
