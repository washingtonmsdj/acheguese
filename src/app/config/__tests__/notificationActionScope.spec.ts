import { describe, expect, it } from "vitest";

import { isNotificationActionHrefEnabled } from "../notificationActionScope";

describe("notificationActionScope", () => {
  it("keeps horizontal platform notification destinations available", () => {
    for (const href of [
      "/notificacoes",
      "/conta/notificacoes",
      "/mensagens",
      "/mapa",
      "/perto-de-mim",
      "/busca",
      "/empresas",
      "/central/empresas",
    ]) {
      expect(isNotificationActionHrefEnabled(href), href).toBe(true);
    }
  });

  it("fails closed for CTAs owned by paused verticals", () => {
    for (const href of [
      "/gastronomia/pedidos/123",
      "/servicos/ba/salvador",
      "/classificados/item/123",
      "/eventos/123",
      "/vagas/123",
      "/educacao/escola/123",
      "/mobilidade/corrida/123",
      "/comunicacao/canal/123",
      "/cupons/123",
      "/comunidade/post/123",
      "/pontos-turisticos/123",
      "/ranking",
      "/planos",
      "/perfil/familia",
      "/central/profissional",
    ]) {
      expect(isNotificationActionHrefEnabled(href), href).toBe(false);
    }
  });

  it("leaves external links to SafeLink validation", () => {
    expect(isNotificationActionHrefEnabled("https://example.com/path")).toBe(true);
  });
});
