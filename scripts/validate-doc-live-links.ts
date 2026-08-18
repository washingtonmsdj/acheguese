import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// docs/README.md remains the single documentation SSOT. Root entry points and
// active security execution docs are validated as live navigation surfaces so
// they cannot silently drift to deleted or moved files.
const LIVE_DOCS = [
  "README.md",
  "SECURITY.md",
  "docs/README.md",
  "docs/08-roadmap/SECURITY-REMEDIATION-PLAN-2026-08.md",
  "docs/08-roadmap/SECURITY-IMPLEMENTATION-CHECKLIST.md",
  "docs/09-reference/SECURITY-AUDIT-2026-08.md",
  "docs/09-reference/SECURITY-VERIFICATION-MATRIX.md",
] as const;

function extractLocalLinks(markdown: string): string[] {
  const matches = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];

  return matches
    .map((match) => match[1].trim())
    .map((link) => {
      if (link.startsWith("<") && link.endsWith(">")) {
        return link.slice(1, -1).trim();
      }
      return link;
    })
    .filter((link) => link.length > 0)
    .filter(
      (link) =>
        !link.startsWith("#") &&
        !/^https?:\/\//i.test(link) &&
        !/^mailto:/i.test(link) &&
        !/^tel:/i.test(link) &&
        !/^data:/i.test(link),
    );
}

function normalizeLocalTarget(link: string): string {
  const withoutFragment = link.split("#", 1)[0];
  const withoutQuery = withoutFragment.split("?", 1)[0];
  return decodeURIComponent(withoutQuery);
}

function validateFile(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8");
  const links = extractLocalLinks(content);
  const missing: string[] = [];

  for (const link of links) {
    const localTarget = normalizeLocalTarget(link);
    if (!localTarget) continue;

    const target = resolve(dirname(filePath), localTarget);
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

  console.log(
    `Links dos docs vivos validados com sucesso (${LIVE_DOCS.length} arquivos).`,
  );
}

main();
