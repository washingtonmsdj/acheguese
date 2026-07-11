import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

const suspiciousMojibakeTokens = [
  "Ã¡",
  "Ã¢",
  "Ã£",
  "Ã§",
  "Ã©",
  "Ãª",
  "Ã­",
  "Ã³",
  "Ãµ",
  "Ãº",
  "Ã‡",
  "Â°",
  "â€¢",
  "â˜…",
  "â€“",
  "â€”",
  "â€œ",
  "â€",
] as const;

const publicSurfaceFiles = [
  "src/app/components/Breadcrumbs.tsx",
  "src/app/pages/MainLandingPage.tsx",
  "src/app/pages/CidadeLandingPage.tsx",
  "src/app/pages/EmpresasLandingPage.tsx",
  "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
  "src/modules/classifieds/pages/ClassificadosPage.tsx",
  "src/app/pages/CidadeLanding.neighborhood-hero.tsx",
  "src/app/pages/CidadeLanding.neighborhood-stream.tsx",
  "src/app/pages/CidadeLanding.neighborhood-panels.tsx",
] as const;

describe("public territorial copy regression", () => {
  it("keeps public territorial surfaces free from common mojibake tokens", () => {
    for (const file of publicSurfaceFiles) {
      const content = read(file);
      for (const token of suspiciousMojibakeTokens) {
        expect(content.includes(token), `${file} should not contain ${token}`).toBe(false);
      }
    }
  });

  it("preserves canonical neighborhood community copy", () => {
    const hero = read("src/app/pages/CidadeLanding.neighborhood-hero.tsx");
    expect(hero).toContain("Comunidade publica");
    expect(hero).toContain("Leitura publica");
    expect(hero).toContain("servicos e negocios perto de voce");

    const stream = read("src/app/pages/CidadeLanding.neighborhood-stream.tsx");
    expect(stream).toContain("Tudo do bairro");
    expect(stream).toContain("Comentar");
    expect(stream).toContain("Recomendar");
    expect(stream).toContain("Avaliar");
    expect(stream).toContain("Interagir");

    const panels = read("src/app/pages/CidadeLanding.neighborhood-panels.tsx");
    expect(panels).toContain("Morar aqui libera publicação e grupos");
    expect(panels).toContain("Entrar libera comentários e recomendações");
    expect(panels).toContain("Sem alertas públicos agora");
    expect(panels).toContain("Enviar alerta ou informação");
  });

  it("preserves canonical city and landing module labels", () => {
    const cityLanding = read("src/app/pages/CidadeLandingPage.tsx");
    expect(cityLanding).toContain("Serviços");
    expect(cityLanding).toContain("Território verificado");
    expect(cityLanding).toContain("Resultados conectados ao território atual");

    const mainLanding = read("src/app/pages/MainLandingPage.tsx");
    expect(mainLanding).toContain("Tudo do seu bairro,");
    expect(mainLanding).toContain("Comunidades em destaque");
    expect(mainLanding).toContain("Ranking das comunidades");
    expect(mainLanding).toContain("Anúncios de empresas locais");

    const breadcrumbs = read("src/app/components/Breadcrumbs.tsx");
    expect(breadcrumbs).toContain('configuracoes: "Configurações"');
    expect(breadcrumbs).toContain('services: "Serviços"');
  });
});
