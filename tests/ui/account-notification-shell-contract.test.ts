import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/app/pages/NotificationPreferencesPage.tsx"),
  "utf8",
);

describe("account notification concept shell", () => {
  it("keeps loading and errors inside the canonical account shell", () => {
    expect(source).toContain('title="Notificações"');
    expect(source).toContain("Carregando suas preferências de aviso.");
    expect(source).toContain("Carregando preferências...");
    expect(source).toContain("Não foi possível carregar suas preferências agora.");
    expect(source).toContain("Tente novamente. Seus controles permanecerão indisponíveis");
    expect(source).not.toContain("error: loadError");
  });

  it("keeps canonical preference reads and writes while polishing presentation", () => {
    expect(source).toContain("NotificationPreferencesService.get()");
    expect(source).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(source).toContain("Notificações push");
    expect(source).toContain("Ative, teste ou remova os avisos deste navegador.");
    expect(source).toContain("Escolha se prefere avisos na hora ou em resumos.");
  });

  it("does not expose raw persistence errors in notification toasts", () => {
    expect(source).toContain('title: "Não foi possível salvar"');
    expect(source).toContain("Nenhuma preferência será presumida como alterada.");
    expect(source).not.toContain("description: error.message");
  });
});
