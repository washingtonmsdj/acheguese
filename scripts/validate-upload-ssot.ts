#!/usr/bin/env tsx
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

type Violation = {
  file: string;
  line: number;
  rule: string;
  snippet: string;
};

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

const TS_FILE = /\.(ts|tsx)$/;

const ALLOW_DIRECT_STORAGE = [
  "src/core/media/services/MediaService.ts",
];

const ALLOW_OPTIMIZE_IMAGE = [
  "src/shared/utils/imageOptimizer.ts",
  "src/core/media/services/MediaService.ts",
];

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      walk(full, out);
      continue;
    }
    if (TS_FILE.test(entry)) out.push(full);
  }
}

function scanFile(file: string): Violation[] {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      line.includes("supabase.storage") &&
      !ALLOW_DIRECT_STORAGE.includes(rel)
    ) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: "Uso direto de storage fora do MediaService",
        snippet: line.trim(),
      });
    }

    if (
      line.includes("optimizeImage(") &&
      !ALLOW_OPTIMIZE_IMAGE.includes(rel)
    ) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: "Otimização de imagem fora do SSOT",
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

function main() {
  const files: string[] = [];
  walk(SRC_DIR, files);

  const violations = files.flatMap(scanFile);
  if (violations.length === 0) {
    console.log("✅ Upload SSOT validado: nenhum desvio encontrado.");
    return;
  }

  console.error(`❌ Upload SSOT: ${violations.length} desvio(s) encontrado(s).`);
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} | ${v.rule}`);
    console.error(`  ${v.snippet}`);
  }
  process.exit(1);
}

main();

