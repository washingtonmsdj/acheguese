import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("service worker launch-scope notification boundary", () => {
  const sw = read("public/sw.js");
  const pausedRouteBlock =
    sw.match(
      /const PAUSED_NOTIFICATION_ROUTE_PATTERN =([\s\S]*?);\n\nfunction getLaunchSafeNotificationUrl/,
    )?.[1] ?? "";

  it("keeps horizontal active routes available", () => {
    for (const segment of ["mensagens", "notificacoes", "mapa", "perto-de-mim", "busca", "empresas"]) {
      expect(pausedRouteBlock, segment).not.toContain(segment);
    }
  });

  it("keeps paused vertical/product surfaces fail-closed in notification deep-links", () => {
    for (const segment of [
      "mobility",
      "mobilidade",
      "track",
      "motorista",
      "passageiro",
      "educacao",
      "comunicacao",
      "cupons",
      "promocoes",
      "ranking",
      "gamificacao",
      "analytics",
      "alertas",
      "achados-perdidos",
      "achados-e-perdidos",
      "problemas",
      "planos",
      "checkout",
      "gastronomia",
      "servicos",
      "classificados",
      "pontos-turisticos",
      "guia",
      "comunidade",
      "eventos",
      "vagas",
      "oportunidades",
      "settings\\/subscription",
      "perfil\\/familia",
    ]) {
      expect(pausedRouteBlock, segment).toContain(segment);
    }
  });

  it("routes payment notifications through the same paused-surface gate", () => {
    expect(sw).toContain(
      "case 'payment':\n      return getLaunchSafeNotificationUrl('/settings/subscription');",
    );
    expect(sw).not.toContain(
      "case 'payment':\n      return '/settings/subscription';",
    );
  });
});
