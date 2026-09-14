import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const privacy = readFileSync(resolve(process.cwd(), "src/app/pages/PrivacySettingsPage.tsx"), "utf8");

describe("privacy concept responsive contract", () => {
  it("uses the approved mobile and desktop privacy headings from one real page", () => {
    expect(privacy).toContain('title={scheduled ? "Exclusão da conta solicitada" : "Privacidade e dados"}');
    expect(privacy).toContain('desktopTitle={scheduled ? "Exclusão da conta solicitada" : "Suas escolhas, seus dados"}');
    expect(privacy).toContain('mobileDescription={scheduled ? "Consulte o andamento e as opções disponíveis." : "Preferências da sua conta."}');
    expect(privacy).toContain('desktopDescription={scheduled ? "Consulte o andamento e as opções disponíveis." : "Você no controle da sua privacidade."}');
  });

  it("keeps the concept surfaces wired to real privacy authority", () => {
    expect(privacy).toContain("PrivacySettingsService.recordConsent");
    expect(privacy).toContain("PrivacySettingsService.exportUserData");
    expect(privacy).toContain("PrivacySettingsService.requestAccountDeletion");
    expect(privacy).toContain("PrivacySettingsService.cancelAccountDeletion");
    expect(privacy).toContain("Medição de uso");
    expect(privacy).toContain("Ofertas e novidades");
    expect(privacy).toContain("Cookies e permissões");
    expect(privacy).toContain("Localização neste dispositivo");
    expect(privacy).toContain("Gerenciar em Meus perfis");
    expect(privacy).toContain("Exportar meus dados");
    expect(privacy).toContain("Histórico de consentimentos");
    expect(privacy).toContain("Falar sobre meus dados");
  });

  it("represents export and deletion states without inventing availability", () => {
    expect(privacy).toContain("Durante a exportação");
    expect(privacy).toContain("Preparando arquivo...");
    expect(privacy).toContain("deletionStatusLoading");
    expect(privacy).toContain("deletionStatusError");
    expect(privacy).toContain("Solicitação registrada");
    expect(privacy).toContain("Cancelar solicitação");
    expect(privacy).toContain("Disponível enquanto o cancelamento for permitido.");
    expect(privacy).toContain("event.preventDefault()");
  });
});
