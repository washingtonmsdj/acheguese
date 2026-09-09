#!/usr/bin/env node
/**
 * Validate documentation placement in repository root.
 *
 * Policy (docs/DECISIONS.md D-013):
 * - Allow only README.md, SECURITY.md and the temporary compatibility pointer in root.
 * - All other markdown files must live under docs/ or module folders.
 */

import { readdirSync, statSync } from "fs";
import { join } from "path";

const rootDir = process.cwd();

const ALLOWED_ROOT_MARKDOWN = new Set([
  "README.md",
  "SECURITY.md",
  "URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md",
]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

function hasMarkdownExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return Array.from(MARKDOWN_EXTENSIONS).some((ext) => lower.endsWith(ext));
}

function main(): void {
  const entries = readdirSync(rootDir, { withFileTypes: true });

  const violations = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => hasMarkdownExtension(name))
    .filter((name) => !ALLOWED_ROOT_MARKDOWN.has(name));

  if (violations.length === 0) {
    console.log("Root docs structure is valid.");
    return;
  }

  console.error("Root docs structure violation: markdown files found outside policy.");
  for (const file of violations.sort()) {
    const fullPath = join(rootDir, file);
    const isFile = statSync(fullPath).isFile();
    if (isFile) {
      console.error(`- ${file}`);
    }
  }

  console.error(
    "\nAllowed in root: README.md, SECURITY.md, URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md",
  );
  console.error("Move active markdown files to docs/ or to the owning module folder.");
  process.exit(1);
}

main();
