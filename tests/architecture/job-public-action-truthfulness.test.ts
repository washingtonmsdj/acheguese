import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const hook = read("src/modules/classifieds/jobs/hooks/useVagaDetail.ts");
const page = read(
  "src/modules/classifieds/jobs/pages/VagaDetailPublicPage.tsx",
);
const listingPage = read(
  "src/modules/classifieds/jobs/pages/VagasPublicPage.tsx",
);

describe("job public action truthfulness", () => {
  it("fails closed when an external application channel cannot really open", () => {
    expect(hook).toContain("buildWhatsAppUrl");
    expect(hook).toContain("onlyDigits(vaga.applicationWhatsapp)");
    expect(hook).toContain("openSafeExternalUrl(url");
    expect(hook).toContain("openContactUrl(url)");
    expect(hook).toContain("openSafeExternalUrl(vaga.applicationUrl");
    expect(hook).toContain("openContactUrl(buildTelUrl(vaga.applicationPhone))");

    for (const message of [
      "Canal de candidatura por WhatsApp indisponível.",
      "Não foi possível abrir o WhatsApp para esta vaga.",
      "E-mail de candidatura indisponível ou inválido.",
      "Link externo de candidatura indisponível ou inválido.",
      "Telefone de candidatura indisponível ou inválido.",
    ]) {
      expect(hook).toContain(message);
    }

    expect(hook).not.toContain("https://wa.me/55${vaga.applicationWhatsapp");
  });

  it("distinguishes native sharing from clipboard copy and propagates failures", () => {
    expect(hook).toContain("type VagaShareResult = 'shared' | 'copied'");
    expect(hook).toContain("Promise<VagaShareResult>");
    expect(hook).toContain("return 'shared'");
    expect(hook).toContain("return 'copied'");
    expect(hook).toContain("error.name === 'AbortError'");
    expect(hook).not.toContain("Usário cancelou ou não suportado");

    expect(page).toContain('result === "copied"');
    expect(page).toContain('title: "Link copiado!"');
    expect(page).toContain('title: "Compartilhamento concluído"');
    expect(page).toContain('error.name === "AbortError"');
    expect(page).toContain('title: "Não foi possível compartilhar"');
  });

  it("keeps public report confirmation factual", () => {
    expect(page).toContain("Nossa equipe recebeu a denúncia para análise.");
    expect(page).not.toContain("Nossa equipe ira analisar esta vaga em breve.");
  });

  it("resolves the company profile through the canonical business URL owner", () => {
    expect(page).toContain("BusinessUrlService.resolveById(vaga.empresaId)");
    expect(page).toContain("BusinessUrlService.getPublicCanonicalUrl(context)");
    expect(page).not.toContain("navigate(\`/empresa/\${vaga.empresaId}\`)");
    expect(page).toContain("Perfil da empresa indisponível");
  });

  it("does not present external-channel opens as known application totals", () => {
    expect(page).toContain('vaga.applicationChannel === "internal"');
    expect(page).toContain("Candidaturas no Achegue-se");
    expect(page).not.toContain('>Candidaturas</span>');
  });

  it("uses the vacancy own territory for related jobs when no override is supplied", () => {
    expect(hook).toContain("const relatedLocationId = locationId ?? vaga?.locationId");
    expect(hook).toContain(
      "VagasService.getVagasRelacionadas(vaga.id, relatedLocationId, 4)",
    );
    expect(hook).toContain("enabled: Boolean(vaga?.id && relatedLocationId)");
  });

  it("keeps SEO descriptive even when the vacancy cannot be applied to", () => {
    expect(page).not.toContain("Candidate-se agora!");
  });

  it("keeps the jobs listing SEO truthful when the runtime is empty", () => {
    expect(listingPage).toContain("total > 0");
    expect(listingPage).toContain("oportunidades de trabalho publicadas no Achegue-se");
    expect(listingPage).toContain("No momento não há vagas publicadas");
    expect(listingPage).not.toContain("Candidate-se agora!");
  });
});
