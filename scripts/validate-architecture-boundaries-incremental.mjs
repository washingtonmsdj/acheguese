#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const MODULES_DIR = path.join(SRC_DIR, "modules");
const BASELINE_PATH = path.join(
  ROOT,
  "docs",
  "audits",
  "architecture-boundaries-incremental-baseline.json",
);

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const SUPABASE_BOUNDARY_RE =
  /(\(\s*supabase\s+as\s+any\s*\)|\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(|from\s+['"]@\/integrations\/supabase(?:\/client)?['"])/;
const DEPRECATED_MODULE_IMPORTS = new Set(["analytics", "notifications"]);

function normalize(filePath) {
  return filePath.replace(/\\/g, "/");
}

function relativeToRoot(filePath) {
  return normalize(path.relative(ROOT, filePath));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "dist", "build", "coverage"].includes(entry.name)) {
        continue;
      }
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && CODE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function keyOf(violation) {
  return `${violation.kind}|${violation.file}|${violation.message}`;
}

function extractImports(content) {
  return Array.from(content.matchAll(IMPORT_RE)).map((match) => match[1]);
}

function resolveImport(currentFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const resolved = path.resolve(path.dirname(currentFile), specifier);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    path.join(resolved, "index.ts"),
    path.join(resolved, "index.tsx"),
    path.join(resolved, "index.js"),
    path.join(resolved, "index.jsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return normalize(candidate);
  }

  return null;
}

function dedupe(violations) {
  const seen = new Set();
  return violations.filter((violation) => {
    const key = keyOf(violation);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectMissingBarrels() {
  if (!fs.existsSync(MODULES_DIR)) return [];
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const barrelPath = path.join(MODULES_DIR, entry.name, "index.ts");
    if (fs.existsSync(barrelPath)) continue;

    violations.push({
      kind: "missing-barrel",
      file: normalize(path.join("src", "modules", entry.name)),
      message: `Modulo sem barrel publico obrigatorio: src/modules/${entry.name}/index.ts`,
    });
  }

  return violations;
}

function collectCrossModuleViolations(files) {
  const violations = [];

  for (const file of files) {
    const relativeFile = relativeToRoot(file);
    const moduleMatch = relativeFile.match(/^src\/modules\/([^/]+)\//);
    if (!moduleMatch) continue;

    const currentModule = moduleMatch[1];
    const content = fs.readFileSync(file, "utf-8");

    for (const specifier of extractImports(content)) {
      const aliasMatch = specifier.match(/^@\/modules\/([^/]+)/);
      if (aliasMatch && aliasMatch[1] !== currentModule) {
        violations.push({
          kind: "cross-module-import",
          file: relativeFile,
          message: `Import cruzado entre modulos: ${currentModule} -> ${aliasMatch[1]}.`,
        });
        continue;
      }

      const resolved = resolveImport(file, specifier);
      if (!resolved) continue;
      const resolvedModuleMatch = resolved.match(/\/src\/modules\/([^/]+)\//);
      if (resolvedModuleMatch && resolvedModuleMatch[1] !== currentModule) {
        violations.push({
          kind: "cross-module-import",
          file: relativeFile,
          message: `Import relativo cruzado entre modulos: ${currentModule} -> ${resolvedModuleMatch[1]}.`,
        });
      }
    }
  }

  return violations;
}

function collectSupabaseTsxViolations(files) {
  const violations = [];
  for (const file of files) {
    if (!file.endsWith(".tsx")) continue;
    const relativeFile = relativeToRoot(file);
    const content = fs.readFileSync(file, "utf-8");

    if (SUPABASE_BOUNDARY_RE.test(content)) {
      violations.push({
        kind: "supabase-in-tsx",
        file: relativeFile,
        message: "Acesso direto ao Supabase em arquivo TSX fora de service/repository.",
      });
    }
  }
  return violations;
}

function collectDeprecatedModuleImportViolations(files) {
  const violations = [];

  for (const file of files) {
    const relativeFile = relativeToRoot(file);
    if (!/^(src\/app|src\/core|src\/shared)\//.test(relativeFile)) continue;

    const content = fs.readFileSync(file, "utf-8");
    for (const specifier of extractImports(content)) {
      const aliasMatch = specifier.match(/^@\/modules\/([^/]+)/);
      if (!aliasMatch) continue;

      const importedModule = aliasMatch[1];
      if (!DEPRECATED_MODULE_IMPORTS.has(importedModule)) continue;

      violations.push({
        kind: "deprecated-module-import",
        file: relativeFile,
        message: `Import proibido de facade legada: ${specifier}. Use ownership canonico em core.`,
      });
    }
  }

  return violations;
}

function collectViolations() {
  const files = walk(SRC_DIR);
  return dedupe([
    ...collectCrossModuleViolations(files),
    ...collectSupabaseTsxViolations(files),
    ...collectDeprecatedModuleImportViolations(files),
    ...collectMissingBarrels(),
  ]).sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Baseline nao encontrado em ${normalize(path.relative(ROOT, BASELINE_PATH))}`);
  }
  const raw = fs.readFileSync(BASELINE_PATH, "utf-8");
  const payload = JSON.parse(raw);
  return new Set(payload.keys ?? []);
}

function writeBaseline(violations) {
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    total: violations.length,
    keys: violations.map(keyOf),
  };
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  console.log(
    `Baseline incremental atualizado em ${normalize(path.relative(ROOT, BASELINE_PATH))} (${payload.total} itens).`,
  );
}

function printGrouped(title, items) {
  if (items.length === 0) {
    console.log(`${title}: nenhum item.`);
    return;
  }

  console.error(`${title}: ${items.length}`);
  for (const item of items.slice(0, 20)) {
    console.error(`- [${item.kind}] ${item.file}: ${item.message}`);
  }
  if (items.length > 20) {
    console.error(`- ... e mais ${items.length - 20}`);
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const strictMode = args.has("--strict");
  const updateBaseline = args.has("--update-baseline");
  const jsonOutput = args.has("--json");

  const current = collectViolations();

  if (updateBaseline) {
    writeBaseline(current);
    return;
  }

  if (strictMode) {
    if (jsonOutput) {
      console.log(JSON.stringify(current, null, 2));
    } else {
      printGrouped("Violacoes atuais de boundary (modo estrito)", current);
    }
    if (current.length > 0) process.exit(1);
    return;
  }

  const baseline = readBaseline();
  const newViolations = current.filter((item) => !baseline.has(keyOf(item)));
  const resolvedCount = [...baseline].filter(
    (key) => !current.some((item) => keyOf(item) === key),
  ).length;

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          mode: "incremental",
          currentTotal: current.length,
          baselineTotal: baseline.size,
          newViolations,
          resolvedCount,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `Arquitetura incremental: ${current.length} violacoes atuais, ${resolvedCount} resolvidas vs baseline, ${newViolations.length} novas.`,
    );
    printGrouped("Novas violacoes (bloqueantes)", newViolations);
  }

  if (newViolations.length > 0) {
    process.exit(1);
  }
}

main();
