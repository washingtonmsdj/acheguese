import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const LIVE_DOCS = [
  "docs/README.md",
  "docs/INDEX_CANONICO.md",
  "docs/CURRENT_RULES.md",
  "docs/CANONICAL_MAP.md",
  "docs/STATUS_ATUAL.md",
] as const;

function extractRelativeLinks(markdown: string): string[] {
  const matches = [...markdown.matchAll(/\[[^\]]+\]\((\.[^)]+)\)/g)];
  return matches.map((match) => match[1]).filter((link) => link.startsWith("./"));
}

function validateFile(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8");
  const links = extractRelativeLinks(content);
  const missing: string[] = [];

  for (const link of links) {
    const target = resolve(dirname(filePath), link.slice(2));
    if (!existsSync(target)) {
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

main();
