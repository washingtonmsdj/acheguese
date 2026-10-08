import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractRelativeLinks,
  LIVE_DOCS,
  validateFile,
} from "../../tools/architecture/validate-doc-live-links";

describe("links do SSOT documental", () => {
  it("inclui links parent, sibling e sem prefixo; ignora links externos e rotas web", () => {
    expect(
      extractRelativeLinks(`
[parent](../README.md)
[sibling](./owner.md#seccao)
[bare](owner.md "titulo")
[encoded](./space%20name.md)
[external](https://example.com/docs)
[email](mailto:contato@example.com)
[anchor](#titulo)
[site](/empresas)
`),
    ).toEqual([
      "../README.md",
      "./owner.md#seccao",
      "owner.md",
      "./space%20name.md",
    ]);
  });

  it("resolve links a partir do diretorio do documento, sem remover ../", () => {
    const root = mkdtempSync(join(tmpdir(), "acheguese-doc-links-"));
    try {
      const docs = join(root, "docs");
      mkdirSync(docs);
      writeFileSync(join(root, "README.md"), "# Raiz");
      writeFileSync(join(docs, "owner.md"), "# Owner");
      writeFileSync(join(docs, "space name.md"), "# Com espaco");
      const index = join(docs, "index.md");

      writeFileSync(
        index,
        [
          "[raiz](../README.md)",
          "[dono](./owner.md#contrato)",
          "[codificado](./space%20name.md)",
          "[quebrado pai](../nao-existe.md)",
          "[quebrado local](./ausente.md)",
          "[url malformada](./nome%ZZ.md)",
        ].join("\n"),
      );

      expect(validateFile(index)).toEqual([
        `${index} -> ../nao-existe.md`,
        `${index} -> ./ausente.md`,
        `${index} -> ./nome%ZZ.md (URL malformada)`,
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("mantém resolvidos os links dos índices e contratos documentais ativos", () => {
    expect(LIVE_DOCS).toContain("docs/README.md");
    expect(LIVE_DOCS).toContain("docs/03-architecture/MAINTENANCE.md");
    expect(LIVE_DOCS).toContain("docs/08-roadmap/README.md");
    for (const file of LIVE_DOCS) {
      expect(validateFile(file), file).toEqual([]);
    }
  });
});
