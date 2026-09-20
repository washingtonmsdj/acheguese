import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public status boundary", () => {
  const page = readFileSync("src/app/pages/StatusPage.tsx", "utf8");
  const healthEdge = readFileSync("supabase/functions/health-check/index.ts", "utf8");

  it("keeps the infrastructure health endpoint admin-only", () => {
    expect(healthEdge).toContain("requireAdmin(req)");
  });

  it("does not present the admin endpoint as public realtime monitoring", () => {
    expect(page).not.toContain("buildSupabaseFunctionUrl('health-check')");
    expect(page).not.toContain("setInterval(checkHealth");
    expect(page).not.toContain("duration_ms");
    expect(page).not.toContain("Monitoramento em tempo real");
    expect(page).toContain("Monitoramento público");
    expect(page).toContain("Não publicado");
  });

  it("routes users to a real support surface instead of inventing availability", () => {
    expect(page).toContain('to="/contato"');
    expect(page).toContain("não possui uma fonte pública dedicada");
  });
});
