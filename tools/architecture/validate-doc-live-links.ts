import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// docs/README.md permanece a única porta de entrada documental.
// Validar também os índices ativos e o owner de manutenção evita a volta
// silenciosa de links para caminhos renomeados/arquivados.
export const LIVE_DOCS = [
  "README.md",
  "docs/README.md",
  "docs/03-architecture/ARCHITECTURE.md",
  "docs/03-architecture/MAINTENANCE.md",
  "docs/08-roadmap/README.md",
  "docs/08-roadmap/NEXT-STEPS.md",
  "src/modules/README.md",
  "src/modules/business/VALIDATION.md",
] as const;

/**
 * Captura links locais do Markdown, inclusive ../ e nomes sem prefixo ./.
 * Links externos, rotas absolutas do site e ancora dentro do mesmo documento
 * nao correspondem a arquivos versionados.
 */
export function extractRelativeLinks(markdown: string): string[] {
  const matches = markdown.matchAll(
    /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']+["'])?\s*\)/g,
  );

  return [...matches]
    .map((match) => match[1] ?? match[2])
    .filter(
      (link): link is string =>
        Boolean(link) &&
        !link.startsWith("#") &&
        !link.startsWith("/") &&
        !/^[a-z][a-z0-9+.-]*:/i.test(link),
    );
}

export function validateFile(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8");
  const missing: string[] = [];

  for (const link of extractRelativeLinks(content)) {
    const pathname = link.split(/[?#]/, 1)[0];
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      missing.push(`${filePath} -> ${link} (URL malformada)`);
      continue;
    }

    if (!decoded || !existsSync(resolve(dirname(filePath), decoded))) {
      missing.push(`${filePath} -> ${link}`);
    }
  }

  return missing;
}

function main(): void {
  const missingLinks: string[] = [];

  for (const file of LIVE_DOCS) {
    if (!existsSync(file)) {
      missingLinks.push(`arquivo ausente: ${file}`);
      continue;
    }
    missingLinks.push(...validateFile(file));
  }

  if (missingLinks.length > 0) {
    console.error("Falha na validacao de links dos docs vivos.");
    for (const entry of missingLinks) {
      console.error(`- ${entry}`);
    }
    process.exit(1);
  }

  console.log("Links dos docs vivos validados com sucesso.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
