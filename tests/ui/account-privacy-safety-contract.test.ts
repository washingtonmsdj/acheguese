import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const privacy = readFileSync(
  resolve(root, "src/app/pages/PrivacySettingsPage.tsx"),
  "utf8",
);

describe("account privacy safety contract", () => {
  it("renders each consent control once while preserving the concept summary", () => {
    expect(privacy).toContain("CONSENT_ROWS.slice(0, 2)");
    expect(privacy).toContain("CONSENT_ROWS.slice(2)");
    expect(privacy).not.toContain("CONSENT_ROWS.map(");
    expect(privacy).toContain('idPrefix="summary"');
    expect(privacy).toContain('idPrefix="details"');
  });

  it("does not conflate account location consent with browser permission", () => {
    expect(privacy).toContain('"Uso da localização"');
    expect(privacy).toContain("Autoriza o uso de localização quando o navegador também permitir.");
    expect(privacy).toContain("A permissão do dispositivo continua sob controle do navegador.");
    expect(privacy).not.toContain('title="Localização neste dispositivo"');
  });

  it("keeps export filenames private and releases temporary object URLs after the click", () => {
    expect(privacy).toContain('anchor.download = `meus-dados-${new Date().toISOString().split("T")[0]}.json`');
    expect(privacy).not.toContain("user.id.slice");
    expect(privacy).toContain("document.body.removeChild(anchor)");
    expect(privacy).toContain("window.setTimeout(() => window.URL.revokeObjectURL(url), 0)");
  });

  it("does not expose provider errors in destructive account-deletion feedback", () => {
    expect(privacy).toContain('description: "Não foi possível solicitar a exclusão da conta."');
    expect(privacy).not.toContain("error instanceof Error ? error.message");
    expect(privacy).not.toContain("recorte principal do concept");
    expect(privacy).not.toContain("autoridade de consentimento");
  });

  it("keeps the destructive confirmation usable in a 360px-class viewport", () => {
    expect(privacy).toContain("max-h-[calc(100dvh-2rem)]");
    expect(privacy).toContain("overflow-y-auto");
    expect(privacy).toContain("Entendi as consequências da solicitação.");
    expect(privacy).toContain("disabled={!deleteAcknowledged || deleting}");
  });
});
