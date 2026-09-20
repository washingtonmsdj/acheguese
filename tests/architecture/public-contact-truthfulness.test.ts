import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public contact truthfulness", () => {
  const source = readFileSync("src/app/pages/ContactPage.tsx", "utf8");

  it("does not promise an unverified support response SLA", () => {
    expect(source).not.toContain("Até 48 horas úteis");
    expect(source).not.toContain("Tempo de resposta");
    expect(source).not.toContain("<Phone");
  });

  it("keeps public contact dependent on configured production data", () => {
    expect(source).toContain("VITE_CONTACT_EMAIL");
    expect(source).toContain("E-mail público ainda não configurado.");
  });
});
