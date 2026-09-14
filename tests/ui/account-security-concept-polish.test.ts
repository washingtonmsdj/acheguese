import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const security = readFileSync(
  resolve(root, "src/modules/profile/pages/ContaSegurancaPage.tsx"),
  "utf8",
);

describe("account security concept polish", () => {
  it("keeps the MFA setup visually light on mobile while retaining the real enrollment", () => {
    expect(security).toContain('eyebrow="Configurar autenticação"');
    expect(security).toContain('title="Adicione uma camada de proteção"');
    expect(security).toContain('mobileDescription=""');
    expect(security).toContain('desktopDescription="Use um aplicativo autenticador para confirmar novos acessos."');
    expect(security).toContain("lg:rounded-2xl lg:border lg:border-territory-border lg:bg-territory-surface lg:p-5");
    expect(security).toContain('className="h-40 w-40 sm:h-44 sm:w-44"');
    expect(security).toContain("Não consigo escanear");
    expect(security).toContain("underline underline-offset-4");
    expect(security).toContain("enrollment.secret");
    expect(security).toContain("verificationCode.length !== 6");
    expect(security).toContain("A proteção só será ativada depois da confirmação do código.");
  });

  it("matches the concept help prompts without creating fake recovery actions", () => {
    expect(security).toContain('prompt = "Segurança e acesso à conta"');
    expect(security).toContain('actionLabel = "Preciso de ajuda"');
    expect(security).toContain('prompt="Perdeu acesso ao autenticador?"');
    expect(security).toContain('prompt="Não reconhece um acesso?"');
    expect(security).toContain("navigate(SUPPORT_PATH)");
  });

  it("keeps account access truthfully limited to the supported other-session action", () => {
    expect(security).toContain('mobileDescription=""');
    expect(security).toContain('desktopDescription="Mantenha sua conta protegida."');
    expect(security).toContain("Acessos à conta");
    expect(security).toContain("A lista de dispositivos não está disponível agora.");
    expect(security).toContain("Sair dos outros dispositivos");
    expect(security).toContain("Este dispositivo permanece conectado quando a operação é concluída.");
    expect(security).not.toContain("Sair de todos os dispositivos");
    expect(security).not.toContain("Sessão atual");
  });
});