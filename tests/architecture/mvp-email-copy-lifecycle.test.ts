import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const emailService = readFileSync(
  "src/core/notifications/services/EmailService.ts",
  "utf8",
);
const lifecycle = readFileSync(
  "src/app/config/productModuleRegistry.ts",
  "utf8",
);

function welcomeTemplateBlock(): string {
  const start = emailService.indexOf("private static getWelcomeEmailTemplate");
  const end = emailService.indexOf("private static getMFASetupConfirmationTemplate");
  return emailService.slice(start, end);
}

describe("MVP welcome email copy", () => {
  it("keeps paused Services and Jobs out of the welcome promise", () => {
    expect(lifecycle).toContain('services: { status: "paused" }');
    expect(lifecycle).toMatch(/jobs:\s*\{[\s\S]*?status: "paused"/);

    const welcome = welcomeTemplateBlock();
    expect(welcome).not.toContain("explore serviços e oportunidades");
    expect(welcome).not.toContain("serviços e oportunidades");
  });

  it("describes the active Business discovery surfaces instead", () => {
    const welcome = welcomeTemplateBlock();

    expect(welcome).toContain("encontre empresas");
    expect(welcome).toContain("Busca");
    expect(welcome).toContain("Mapa");
    expect(welcome).toContain("Perto de mim");
  });
});
