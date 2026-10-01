import { describe, expect, it } from "vitest";

import { requiresPreContextAuthentication } from "../authRequiredRuntimeRoutes";

describe("requiresPreContextAuthentication", () => {
  it.each([
    "/conta",
    "/conta/seguranca",
    "/conta/editar/00000000-0000-0000-0000-000000000000",
    "/mensagens",
    "/mensagens/business/thread-1",
    "/central",
    "/central/empresas",
    "/notificacoes",
    "/settings/email-logs",
    "/empresas/cadastrar",
  ])("recognizes protected bootstrap path %s", (pathname) => {
    expect(requiresPreContextAuthentication(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/login",
    "/empresas",
    "/mapa",
    "/perto-de-mim",
    "/busca",
    "/sobre",
    "/contato",
  ])("does not preempt public/session-only path %s", (pathname) => {
    expect(requiresPreContextAuthentication(pathname)).toBe(false);
  });
});
