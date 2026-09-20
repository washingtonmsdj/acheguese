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

  it("does not suppress deep-links for launch-active communication, events or jobs", () => {
    expect(pausedRouteBlock).not.toContain("messages");
    expect(pausedRouteBlock).not.toContain("mensagens");
    expect(pausedRouteBlock).not.toContain("chat");
    expect(pausedRouteBlock).not.toContain("eventos");
    expect(pausedRouteBlock).not.toContain("vagas");
    expect(pausedRouteBlock).not.toContain("oportunidades");
  });

  it("keeps paused MVP surfaces fail-closed in notification deep-links", () => {
    for (const segment of [
      "mobility",
      "mobilidade",
      "track",
      "educacao",
      "comunicacao",
      "cupons",
      "ranking",
      "gamificacao",
      "analytics",
      "alertas",
      "achados-perdidos",
      "achados-e-perdidos",
      "problemas",
      "planos",
      "checkout",
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
