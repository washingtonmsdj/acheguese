import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const privacy = readFileSync(
  resolve(root, "src/app/pages/PrivacySettingsPage.tsx"),
  "utf8",
);

describe("account privacy safety contract", () => {
  it("keeps the concept summary and gives responsive detail controls unique ids", () => {
    expect(privacy).toContain("CONSENT_ROWS.slice(0, 2)");
    expect(privacy).toContain("CONSENT_ROWS.slice(2)");
    expect(privacy).not.toContain("CONSENT_ROWS.map(");
    expect(privacy).toContain('idPrefix="summary"');
    expect(privacy).toContain('idPrefix="mobile-details"');
    expect(privacy).toContain('idPrefix="desktop-details"');
    expect(privacy).not.toContain('idPrefix="details"');
  });

  it("keeps extra account permissions collapsed on mobile and fully available on desktop", () => {
    expect(privacy).toContain('id="privacy-more"');
    expect(privacy).toContain("Outras permissões");
    expect(privacy).toContain("lg:hidden");
    expect(privacy).toContain('className="hidden p-4 sm:p-5 lg:block"');
    expect(privacy).toContain("Consentimentos e permissões");
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

  it("lets the scheduled mobile state own the icon-first concept heading", () => {
    expect(privacy).toContain("hideMobileHeading={scheduled}");
    expect(privacy).toContain('className="mb-4 text-center lg:hidden"');
    expect(privacy).toContain("mx-auto flex h-16 w-16");
    expect(privacy).toContain(">Exclusão da conta solicitada</h1>");
    expect(privacy).toContain(">Consulte o andamento e as opções disponíveis.</p>");
  });

  it("shows scheduled deletion details without pretending the DPO page is the status detail view", () => {
    expect(privacy).toContain("Ver detalhes");
    expect(privacy).toContain("Data informada para processamento");
    expect(privacy).toContain("O serviço não informou uma data de processamento neste momento.");
    expect(privacy).toContain("Falar com proteção de dados");
    expect(privacy).toContain("navigate(DATA_PROTECTION_CONTACT_PATH)");
    expect(privacy).not.toContain('onClick={() => navigate(DATA_PROTECTION_CONTACT_PATH)}>Ver detalhes</Button>');
  });

  it("keeps the destructive confirmation usable in a 360px-class viewport", () => {
    expect(privacy).toContain("max-h-[calc(100dvh-2rem)]");
    expect(privacy).toContain("overflow-y-auto");
    expect(privacy).toContain("Entendi as consequências da solicitação.");
    expect(privacy).toContain("disabled={!deleteAcknowledged || deleting}");
  });
});